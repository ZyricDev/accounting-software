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

export default {
  countActiveCarts,
  createCart,
};
