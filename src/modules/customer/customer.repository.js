import { pool } from "../../database/connection.js";

const findOrCreateCustomer = async ({ customerName, customerPhone }) => {
  const [rows] = await pool.query(
    `INSERT INTO customers (name, phone)
        VALUES (?, ?)
        NO DUPLICATE KEY UPDATE
         name = VALUES(?),
         
         RETURNING id`,
    [customerName, customerPhone, customerName],
  );

  return rows[0].id;
};

export default { findOrCreateCustomer };
