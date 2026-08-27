import { pool } from "../../database/connection.js";

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

  const whereClause = search ? "AND (name LIKE ? OR barcode LIKE ?)" : "";
  const searchParams = search ? [`%${search}%`, `%${search}%`] : [];

  const [rows] = await pool.query(
    `SELECT id, name, stock, purchase_price, sale_price, last_stock_in_at FROM products 
     WHERE deleted_at IS NULL ${whereClause} 
     ORDER BY ${sortColumn} ${order.toUpperCase()}
     LIMIT ? OFFSET ?`,
    [...searchParams, Number(limit), Number(offset)],
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM products
     WHERE deleted_at IS NULL ${whereClause}`,
    searchParams,
  );

  return { products: rows, total };
};

const getProductById = async (id) => {
  const [rows] = await pool.query(
    "SELECT * FROM products WHERE id= ? AND deleted_at IS NULL",
    [id],
  );

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
    "SELECT id FROM products WHERE name = ? AND deleted_at IS NULL LIMIT 1",
    [name],
  );

  return rows.length > 0;
};

const isBarcodeTaken = async (barcode) => {
  const [rows] = await pool.query(
    "SELECT id FROM products WHERE barcode = ? AND deleted_at IS NULL LIMIT 1",
    [barcode],
  );

  return rows.length > 0;
};

const createProduct = async (productData) => {
  const payload = { ...productData };

  if (payload.stock_history) {
    payload.stock_history = JSON.stringify(payload.stock_history);
  }

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

  await pool.query(
    `UPDATE products SET ${setClause} WHERE id = ? AND deleted_at IS NULL`,
    [...values, id],
  );

  return getProductById(id);
};

const softDeleteProduct = async (id, deletedAt) => {
  await pool.query("UPDATE products SET deleted_at = ? WHERE id = ?", [
    deletedAt,
    id,
  ]);
};

const setStockInfo = async (
  id,
  { stock, purchase_price, stock_history, sale_price },
) => {
  await pool.query(
    `UPDATE products
     SET stock = ?, purchase_price = ?, stock_history = ?, sale_price = ?, last_stock_in_at = NOW()
     WHERE id = ? AND deleted_at IS NULL`,
    [stock, purchase_price, JSON.stringify(stock_history), sale_price, id],
  );

  return getProductById(id);
};

export default {
  getProducts,
  getProductById,
  isProductNameTaken,
  isBarcodeTaken,
  createProduct,
  updateProduct,
  softDeleteProduct,
  setStockInfo,
};
