import { pool } from "../../database/connection.js";

const findOrCreateCustomer = async (
  { customerName, customerPhone },
  executor = pool,
) => {
  const [result] = await executor.query(
    `INSERT INTO customers (name, phone)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE
       name = COALESCE(?, name),
       id = LAST_INSERT_ID(id)`,
    [customerName, customerPhone, customerName],
  );

  return result.insertId;
};

const incrementDebt = async (customerId, amount, executor = pool) => {
  await executor.query(
    "UPDATE customers SET current_balance = current_balance + ? WHERE id = ?",
    [amount, customerId],
  );
};

export default { findOrCreateCustomer, incrementDebt };
