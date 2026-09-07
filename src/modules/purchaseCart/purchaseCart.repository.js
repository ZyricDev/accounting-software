import { pool } from "../../database/connection.js";

const countActiveCarts = async () => {
  const [[{ count }]] = await pool.query(
    "SELECT COUNT(*) AS count FROM purchase_carts",
  );
  return count;
};

const createCart = async () => {
  const [result] = await pool.query(
    "INSERT INTO purchase_carts (items) VALUES (?)",
    [JSON.stringify([])],
  );

  return { id: result.insertId, items: [], discountAmount: 0 };
};

const getActiveCart = async () => {
  const [rows] = await pool.query("SELECT * FROM purchase_carts LIMIT 1");

  const cart = rows[0];
  if (!cart) return null;

  return {
    id: cart.id,
    discountAmount: cart.discount_amount,
    items: typeof cart.items === "string" ? JSON.parse(cart.items) : cart.items,
  };
};

const deleteCartById = async (id, executor = pool) => {
  const [result] = await executor.query(
    "DELETE FROM purchase_carts WHERE id = ?",
    [id],
  );
  return result.affectedRows;
};

const saveCartItems = async (id, items) => {
  await pool.query("UPDATE purchase_carts SET items = ? WHERE id = ?", [
    JSON.stringify(items),
    id,
  ]);
};

const updateCartDiscount = async (id, discountAmount) => {
  await pool.query(
    "UPDATE purchase_carts SET discount_amount = ? WHERE id = ?",
    [discountAmount, id],
  );

  return getActiveCart();
};

export default {
  countActiveCarts,
  createCart,
  getActiveCart,
  deleteCartById,
  saveCartItems,
  updateCartDiscount,
};
