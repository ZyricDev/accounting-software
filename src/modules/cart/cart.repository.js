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
    `SELECT p.id, p.name, p.stock, p.sale_price
     FROM products p
     LEFT JOIN product_barcodes pb 
       ON p.id = pb.product_id AND pb.barcode = ?
     WHERE p.stock > 0
       AND (pb.product_id IS NOT NULL OR p.name LIKE ?)
     ORDER BY 
       CASE WHEN pb.product_id IS NOT NULL THEN 0 ELSE 1 END, 
       p.name ASC`,
    [searchTerm, `%${searchTerm}%`],
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
    couponMinPurchase: cart.coupon_min_purchase,
    items: typeof cart.items === "string" ? JSON.parse(cart.items) : cart.items,
  };
};

const deleteCartById = async (id, executor = pool) => {
  const [result] = await executor.query("DELETE FROM carts WHERE id = ?", [id]);
  return result.affectedRows;
};

const updateCartState = async ({
  id,
  items,
  discountAmount,
  couponMinPurchase,
  discountType,
  couponCode,
}) => {
  await pool.query(
    "UPDATE carts SET items = ?, discount_amount = ?, coupon_min_purchase = ?, discount_type = ?, coupon_code = ? WHERE id = ?",
    [
      JSON.stringify(items),
      discountAmount,
      couponMinPurchase,
      discountType,
      couponCode,
      id,
    ],
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
