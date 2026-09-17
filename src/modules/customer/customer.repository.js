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

const isPhoneTaken = async (phone) => {
  const [rows] = await pool.query(
    "SELECT id FROM customers WHERE phone = ?  LIMIT 1",
    [phone],
  );

  return rows.length > 0;
};

const getCustomerById = async (id) => {
  const [rows] = await pool.query("SELECT * FROM customers WHERE id= ? ", [id]);

  const customer = rows[0];
  if (!customer) {
    return null;
  }

  return customer;
};

const createCustomer = async (customerData) => {
  const columns = Object.keys(customerData);
  const values = Object.values(customerData);
  const placeholders = columns.map(() => "?").join(", ");

  const [result] = await pool.query(
    `INSERT INTO customers (${columns.join(", ")}) VALUES (${placeholders})`,
    values,
  );

  return getCustomerById(result.insertId);
};

export default {
  findOrCreateCustomer,
  incrementDebt,
  isPhoneTaken,
  getCustomerById,
  createCustomer,
};
