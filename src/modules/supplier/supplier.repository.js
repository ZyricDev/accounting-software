import { pool } from "../../database/connection.js";

const isSupplierPhoneTaken = async (phone) => {
  const [rows] = await pool.query(
    "SELECT id FROM suppliers WHERE phone = ? LIMIT 1",
    [phone],
  );

  return rows.length !== 0;
};

const getSupplierById = async (id) => {
  const [rows] = await pool.query("SELECT * FROM suppliers WHERE id= ?", [id]);

  const supplier = rows[0];
  if (!supplier) {
    return null;
  }

  return supplier;
};

const createSupplier = async (supplierData) => {
  const payload = { ...supplierData };

  const columns = Object.keys(payload);
  const values = Object.values(payload);
  const placeholders = columns.map(() => "?").join(", ");

  const [result] = await pool.query(
    `INSERT INTO suppliers (${columns.join(", ")}) VALUES (${placeholders})`,
    values,
  );

  return getSupplierById(result.insertId);
};

export default {
  isSupplierPhoneTaken,
  getSupplierById,
  createSupplier,
};
