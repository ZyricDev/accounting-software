import { pool } from "../../database/connection.js";

const countActiveCarts = async () => {
  const [[{ count }]] = await pool.query("SELECT COUNT(*) AS count FROM carts");

  return count;
};

const createCart = async () => {
  const [result] = await pool.query("INSERT INTO carts  (items) VALUES (?)", [
    JSON.stringify([]),
  ]);

  return { id: result.insertId, items: [] };
};

const getCarts = async () => {
  const [rows] = await pool.query("SELECT id FROM carts");
  return rows;
};

const searchProducts = async (searchTerm) => {
  const [rows] = await pool.query(
    `SELECT id, name, stock, sale_price
     FROM products
     WHERE deleted_at IS NULL
       AND stock > 0
       AND (barcode = ? OR name LIKE ?)
     ORDER BY CASE WHEN barcode = ? THEN 0 ELSE 1 END, name ASC
     LIMIT 10`,
    [searchTerm, `%${searchTerm}%`, searchTerm],
  );

  return rows;
};

const getCartById = async (id) => {
  const [rows] = await pool.query("SELECT * FROM carts WHERE id = ?", [id]);

  const cart = rows[0];
  if (!cart) return null;

  return {
    id: cart.id,
    items: typeof cart.items === "string" ? JSON.parse(cart.items) : cart.items,
  };
};

const deleteCartById = async (id, executor = pool) => {
  const [result] = await executor.query("DELETE FROM carts WHERE id = ?", [id]);

  return result.affectedRows;
};

const saveCartItems = async (id, items) => {
  await pool.query("UPDATE carts SET items = ? WHERE id = ?", [
    JSON.stringify(items),
    id,
  ]);
};

export default {
  countActiveCarts,
  createCart,
  getCarts,
  searchProducts,
  getCartById,
  deleteCartById,
  saveCartItems,
};
