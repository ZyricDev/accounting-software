import { pool } from "../../database/connection.js";

const SORT_COLUMN_MAP = {
  name: "name",
  currentBalance: "current_balance",
};

const getConnection = async () => {
  return await pool.getConnection();
};

const findOrCreateCustomer = async (payload) => {
  const { phone, name, birth_month, birth_day } = payload;

  const [existingRows] = await pool.query(
    "SELECT * FROM customers WHERE phone = ?",
    [phone],
  );

  const existingCustomer = existingRows[0];

  if (existingCustomer) {
    const updates = [];
    const updateValues = [];

    if (name && existingCustomer.name !== name) {
      updates.push("name = ?");
      updateValues.push(name);
    }
    if (birth_month && existingCustomer.birth_month !== birth_month) {
      updates.push("birth_month = ?");
      updateValues.push(birth_month);
    }
    if (birth_day && existingCustomer.birth_day !== birth_day) {
      updates.push("birth_day = ?");
      updateValues.push(birth_day);
    }

    if (updates.length > 0) {
      updateValues.push(existingCustomer.id);
      await pool.query(
        `UPDATE customers SET ${updates.join(", ")} WHERE id = ?`,
        updateValues,
      );
    }

    return getCustomerById(existingCustomer.id);
  }

  const [result] = await pool.query(
    `INSERT INTO customers (phone, name, birth_month, birth_day, initial_balance, current_balance) 
     VALUES (?, ?, ?, ?, 0, 0)`,
    [phone, name || null, birth_month || null, birth_day || null],
  );

  return getCustomerById(result.insertId);
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

const getCustomers = async ({ search, page, limit, sortBy, order }) => {
  const offset = (page - 1) * limit;
  const sortColumn = SORT_COLUMN_MAP[sortBy];

  const whereClause = search ? "WHERE (name LIKE ? OR phone LIKE ?)" : "";
  const searchParams = search ? [`%${search}%`, `%${search}%`] : [];

  const [rows] = await pool.query(
    `SELECT * FROM customers 
       ${whereClause} 
       ORDER BY ${sortColumn} ${order.toUpperCase()}
       LIMIT ? OFFSET ?`,
    [...searchParams, Number(limit), Number(offset)],
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM customers
       ${whereClause}`,
    searchParams,
  );

  return { customers: rows, total };
};

const updateCustomerById = async (id, customerData) => {
  const columns = Object.keys(customerData);
  const values = Object.values(customerData);

  const setClause = columns.map((col) => `${col} = ?`).join(", ");

  await pool.query(`UPDATE customers SET ${setClause} WHERE id = ? `, [
    ...values,
    id,
  ]);

  return getCustomerById(id);
};

const checkCustomerUsage = async (id) => {
  const [[paymentRows], [invoiceRows]] = await Promise.all([
    pool.query("SELECT id FROM payments WHERE person_id = ? LIMIT 1", [id]),
    pool.query("SELECT id FROM sales_invoices WHERE customer_id = ? LIMIT 1", [
      id,
    ]),
  ]);

  return paymentRows.length > 0 || invoiceRows.length > 0;
};

const deleteCustomerById = async (id) => {
  await pool.query("DELETE FROM customers WHERE id = ?", [id]);
};

const updateCustomerStatusById = async (id, status) => {
  await pool.query("UPDATE customers SET is_active = ? WHERE id = ?", [
    status,
    id,
  ]);
};

export default {
  getConnection,
  findOrCreateCustomer,
  incrementDebt,
  isPhoneTaken,
  getCustomerById,
  createCustomer,
  getCustomers,
  updateCustomerById,
  checkCustomerUsage,
  deleteCustomerById,
  updateCustomerStatusById,
};
