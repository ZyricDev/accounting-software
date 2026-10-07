import { pool } from "../../database/connection.js";

const countActiveCarts = async () => {
  const [[{ count }]] = await pool.query("SELECT COUNT(*) AS count FROM carts");
  return count;
};

const createCart = async () => {
  const [result] = await pool.query("INSERT INTO carts (items) VALUES (?)", [
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
     WHERE stock > 0
       AND (barcode = ? OR name LIKE ?)
     ORDER BY CASE WHEN barcode = ? THEN 0 ELSE 1 END, name ASC `,
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
    discountAmount: cart.discount_amount,
    discountType: cart.discount_type,
    couponCode: cart.coupon_code,
    items: typeof cart.items === "string" ? JSON.parse(cart.items) : cart.items,
  };
};

const deleteCartById = async (id, executor = pool) => {
  const [result] = await executor.query("DELETE FROM carts WHERE id = ?", [id]);
  return result.affectedRows;
};

const updateCartState = async (
  id,
  items,
  discountAmount,
  discountType,
  couponCode,
) => {
  await pool.query(
    "UPDATE carts SET items = ?, discount_amount = ?, discount_type = ?, coupon_code = ? WHERE id = ?",
    [JSON.stringify(items), discountAmount, discountType, couponCode, id],
  );
};

export default {
  countActiveCarts,
  createCart,
  getCarts,
  searchProducts,
  getCartById,
  deleteCartById,
  updateCartState,
};
