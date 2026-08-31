import { pool } from "../../database/connection.js";

const findOrCreateCustomer = async ({ customerName, customerPhone }) => {
  const [rows] = await pool.query(
    `
      INSERT INTO customers (name, phone)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        phone = VALUES(phone)
      RETURNING id
    `,
    [customerName, customerPhone],
  );

  return rows[0].id;
};

export default { findOrCreateCustomer };
