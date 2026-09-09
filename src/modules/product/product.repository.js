import { pool } from "../../database/connection.js";
import logger from "../../shared/utils/logger.js";

const SORT_COLUMN_MAP = {
  name: "name",
  stock: "stock",
  purchasePrice: "purchase_price",
  salePrice: "sale_price",
  lastStockInAt: "last_stock_in_at",
};

const getProducts = async ({ search, page, limit, sortBy, order }) => {
  const offset = (page - 1) * limit;
  const sortColumn = SORT_COLUMN_MAP[sortBy];

  const whereClause = search ? "WHERE (name LIKE ? OR barcode LIKE ?)" : "";
  const searchParams = search ? [`%${search}%`, `%${search}%`] : [];

  const [rows] = await pool.query(
    `SELECT id, name, barcode, stock, purchase_price, sale_price, last_stock_in_at FROM products 
     ${whereClause} 
     ORDER BY ${sortColumn} ${order.toUpperCase()}
     LIMIT ? OFFSET ?`,
    [...searchParams, Number(limit), Number(offset)],
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM products
     ${whereClause}`,
    searchParams,
  );

  return { products: rows, total };
};

const getProductById = async (id) => {
  const [rows] = await pool.query("SELECT * FROM products WHERE id= ? ", [id]);

  const product = rows[0];
  if (!product) {
    return null;
  }

  product.stock_history =
    typeof product.stock_history === "string"
      ? JSON.parse(product.stock_history)
      : product.stock_history;

  return product;
};

const isProductNameTaken = async (name) => {
  const [rows] = await pool.query(
    "SELECT id FROM products WHERE name = ?  LIMIT 1",
    [name],
  );

  return rows.length > 0;
};

const isBarcodeTaken = async (barcode) => {
  const [rows] = await pool.query(
    "SELECT id FROM products WHERE barcode = ?  LIMIT 1",
    [barcode],
  );

  return rows.length > 0;
};

const createProduct = async (productData) => {
  const payload = { ...productData };

  const columns = Object.keys(payload);
  const values = Object.values(payload);
  const placeholders = columns.map(() => "?").join(", ");

  const [result] = await pool.query(
    `INSERT INTO products (${columns.join(", ")}) VALUES (${placeholders})`,
    values,
  );

  return getProductById(result.insertId);
};

const updateProduct = async (id, productData) => {
  const columns = Object.keys(productData);
  const values = Object.values(productData);

  const setClause = columns.map((col) => `${col} = ?`).join(", ");

  await pool.query(`UPDATE products SET ${setClause} WHERE id = ? `, [
    ...values,
    id,
  ]);

  return getProductById(id);
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

const decrementStock = async (id, quantity, executor = pool) => {
  await executor.query(
    "UPDATE products SET stock = stock - ?, updated_at = NOW() WHERE id = ?",
    [quantity, id],
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
    `SELECT id, stock, purchase_price
     FROM products
     WHERE id = ? 
     FOR UPDATE`,
    [productId],
  );

  return rows[0] ?? null;
};

const applyPurchaseUpdate = async (
  productId,
  { quantity, purchasePrice, salePrice, invoiceId, supplierId },
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
      purchasePrice,
      salePrice,
      invoiceId,
      supplierId,
      quantity,
      purchasePrice,
      productId,
    ],
  );
};

export default {
  getProducts,
  getProductById,
  isProductNameTaken,
  isBarcodeTaken,
  createProduct,
  updateProduct,
  checkProductUsage,
  hardDeleteProduct,
  decrementStock,
  getProductForUpdate,
  applyPurchaseUpdate,
};
