import { pool } from "../../database/connection.js";

const checkCouponExists = async (code) => {
  const [rows] = await pool.query(`SELECT id FROM coupons WHERE code = ?`, [
    code,
  ]);

  return rows.length > 0;
};

const getCouponByCode = async (code) => {
  const [rows] = await pool.query(`SELECT * FROM coupons WHERE code = ?`, [
    code,
  ]);

  return rows[0] || null;
};

const createCoupon = async (
  { code, amount, minPurchase, expiresAt },
  connection = pool,
) => {
  const [result] = await connection.query(
    `INSERT INTO coupons (code, amount, min_purchase_amount, expires_at) 
     VALUES (?, ?, ?, ?)`,
    [code, amount, minPurchase, expiresAt],
  );
  return result.insertId;
};

export default {
  checkCouponExists,
  getCouponByCode,
  createCoupon,
};
