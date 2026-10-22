import { pool } from "../../database/connection.js";
import logger from "../../shared/utils/logger.js";

const SORT_COLUMN_MAP = {
  name: "p.name",
  stock: "p.stock",
  purchasePrice: "p.purchase_price",
  salePrice: "p.sale_price",
  lastStockInAt: "p.last_stock_in_at",
};

const getProducts = async ({ search, page, limit, sortBy, order }) => {
  const offset = (page - 1) * limit;
  const sortColumn = SORT_COLUMN_MAP[sortBy] || "p.id";

  const whereClause = search
    ? "WHERE (p.name LIKE ? OR p.id IN (SELECT product_id FROM product_barcodes WHERE barcode LIKE ?))"
    : "";
  const searchParams = search ? [`%${search}%`, `%${search}%`] : [];

  const query = `
    SELECT 
      p.id, 
      p.name, 
      p.stock, 
      p.stock_history,
      p.sale_price, 
      p.last_stock_in_at
    FROM products p
    ${whereClause}
    ORDER BY ${sortColumn} ${order ? order.toUpperCase() : "DESC"}
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query(query, [
    ...searchParams,
    Number(limit),
    Number(offset),
  ]);

  const formattedProducts = rows.map((row) => ({
    ...row,
    stock_history:
      typeof row.stock_history === "string"
        ? JSON.parse(row.stock_history)
        : row.stock_history,
  }));

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM products p
     ${whereClause}`,
    searchParams,
  );

  return { products: formattedProducts, total };
};

const getProductById = async (id, executor = pool) => {
  const query = `
    SELECT 
      p.*,
      COALESCE(
        CAST(JSON_ARRAYAGG(pb.barcode) AS CHAR), 
        '[]'
      ) AS barcodes
    FROM products p
    LEFT JOIN product_barcodes pb ON p.id = pb.product_id
    WHERE p.id = ?
    GROUP BY p.id
    LIMIT 1
  `;

  const [rows] = await executor.query(query, [id]);
  const product = rows[0];

  if (!product || !product.id) {
    return null;
  }

  product.barcodes =
    typeof product.barcodes === "string"
      ? JSON.parse(product.barcodes)
      : product.barcodes;

  product.stock_history =
    typeof product.stock_history === "string"
      ? JSON.parse(product.stock_history)
      : product.stock_history;

  return product;
};

const isProductNameTaken = async (name) => {
  const [rows] = await pool.query(
    "SELECT id FROM products WHERE name = ? LIMIT 1",
    [name],
  );
  return rows.length > 0;
};

// در product.repository.js
const getExistingBarcodes = async (barcodesArray) => {
  if (!barcodesArray || barcodesArray.length === 0) return [];
  const [rows] = await pool.query(
    "SELECT barcode, product_id FROM product_barcodes WHERE barcode IN (?)",
    [barcodesArray],
  );

  return rows;
};

const getProductIDByBarcode = async (barcode) => {
  const [rows] = await pool.query(
    "SELECT product_id FROM product_barcodes WHERE barcode = ? LIMIT 1",
    [barcode],
  );
  return rows.length > 0 ? rows[0].product_id : null;
};

const createProductWithBarcodes = async ({ name, barcodes }) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const [result] = await connection.query(
      "INSERT INTO products (name) VALUES (?)",
      [name],
    );
    const productId = result.insertId;

    if (barcodes && barcodes.length > 0) {
      const barcodeValues = barcodes.map((bc, index) => [
        productId,
        bc,
        index === 0 ? 1 : 0,
      ]);

      await connection.query(
        "INSERT INTO product_barcodes (product_id, barcode, is_primary) VALUES ?",
        [barcodeValues],
      );
    }

    await connection.commit();
    return getProductById(productId, pool);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const updateProductWithBarcodes = async (id, productData) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const { barcodes, ...restData } = productData;

    if (Object.keys(restData).length > 0) {
      const columns = Object.keys(restData);
      const values = Object.values(restData);
      const setClause = columns.map((col) => `${col} = ?`).join(", ");

      await connection.query(`UPDATE products SET ${setClause} WHERE id = ?`, [
        ...values,
        id,
      ]);
    }

    if (barcodes && Array.isArray(barcodes)) {
      await connection.query(
        "DELETE FROM product_barcodes WHERE product_id = ?",
        [id],
      );

      if (barcodes.length > 0) {
        const barcodeValues = barcodes.map((bc, index) => [
          id,
          bc,
          index === 0 ? 1 : 0,
        ]);

        await connection.query(
          "INSERT INTO product_barcodes (product_id, barcode, is_primary) VALUES ?",
          [barcodeValues],
        );
      }
    }

    await connection.commit();
    return getProductById(id, pool);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const checkProductUsage = async (productId) => {
  const [sales] = await pool.query(
    "SELECT id FROM sales_invoices_items WHERE product_id = ? LIMIT 1",
    [productId],
  );
  const [purchases] = await pool.query(
    "SELECT id FROM purchase_invoice_items WHERE product_id = ? LIMIT 1",
    [productId],
  );

  return sales.length > 0 || purchases.length > 0;
};

const hardDeleteProduct = async (id) => {
  await pool.query("DELETE FROM products WHERE id = ?", [id]);
};

const adjustStock = async (id, quantityDelta, executor = pool) => {
  await executor.query(
    "UPDATE products SET stock = stock + ?, updated_at = NOW() WHERE id = ?",
    [quantityDelta, id],
  );

  const [rows] = await executor.query(
    "SELECT stock, name FROM products WHERE id = ?",
    [id],
  );
  const product = rows[0];

  if (product && product.stock < 0) {
    logger.warn("موجودی محصول منفی شد", {
      productId: id,
      productName: product.name,
      currentStock: product.stock,
    });
  }
};

const getProductForUpdate = async (productId, executor = pool) => {
  const [rows] = await executor.query(
    `SELECT id, stock, purchase_price, stock_history
     FROM products
     WHERE id = ? 
     FOR UPDATE`,
    [productId],
  );

  return rows[0] ?? null;
};

const applyPurchaseUpdate = async (
  productId,
  {
    quantity,
    averagePurchasePrice,
    purchasePrice,
    salePrice,
    invoiceId,
    supplierId,
  },
  executor = pool,
) => {
  await executor.query(
    `UPDATE products
     SET
       stock = IFNULL(stock, 0) + ?,
       purchase_price = ?,
       sale_price = ?,
       last_stock_in_at = NOW(),
       stock_history = JSON_ARRAY_APPEND(
         COALESCE(stock_history, JSON_ARRAY()),
         '$',
         JSON_OBJECT(
           'invoiceId', ?,
           'supplierId', ?,
           'quantity', ?,
           'purchasePrice', ?,
           'date', NOW()
         )
       )
     WHERE id = ?`,
    [
      quantity,
      averagePurchasePrice,
      salePrice,
      invoiceId,
      supplierId,
      quantity,
      purchasePrice,
      productId,
    ],
  );
};

const updateStockHistory = async (
  productId,
  historyJsonString,
  lastStockInAt,
  connection = pool,
) => {
  const query = `
    UPDATE products 
    SET stock_history = ?, last_stock_in_at = ? 
    WHERE id = ?
  `;

  await connection.query(query, [historyJsonString, lastStockInAt, productId]);
};

const getProductValuation = async (connection = pool) => {
  const query = `
    SELECT 
        COALESCE(SUM(stock * purchase_price), 0) AS totalProductValue,
        COALESCE(SUM(stock * sale_price), 0) AS totalExpectedSales
    FROM products
    WHERE stock > 0;
  `;

  const [rows] = await connection.query(query);

  return rows[0];
};

const updateStockAndWAC = async (productId, newStock, newWAC, connection = pool) => {
  const query = `
    UPDATE products 
    SET stock = ?, purchase_price = ? 
    WHERE id = ?
  `;

  const [result] = await connection.query(query, [newStock, newWAC, productId]);

  return result;
};

export default {
  getProducts,
  getProductById,
  isProductNameTaken,
  getExistingBarcodes,
  getProductIDByBarcode,
  createProductWithBarcodes,
  updateProductWithBarcodes,
  checkProductUsage,
  hardDeleteProduct,
  adjustStock,
  getProductForUpdate,
  applyPurchaseUpdate,
  updateStockHistory,
  getProductValuation,
  updateStockAndWAC,
};
