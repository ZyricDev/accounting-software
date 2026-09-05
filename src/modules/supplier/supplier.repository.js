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

const getSuppliers = async ({ search, limit = 20, page = 1, balanceOrder }) => {
  const offset = (page - 1) * limit;

  let orderClause = "ORDER BY name ASC";
  if (balanceOrder === "most_debt") {
    orderClause = "ORDER BY current_balance DESC"; // بیشترین بدهی ما بالا
  } else if (balanceOrder === "least_debt") {
    orderClause = "ORDER BY current_balance ASC"; // بیشترین طلب ما بالا
  }

  const whereClause = search ? "WHERE (name LIKE ? OR phone LIKE ?)" : "";
  const searchParams = search ? [`%${search}%`, `%${search}%`] : [];

  const [rows] = await pool.query(
    `SELECT * FROM suppliers
       ${whereClause}
       ${orderClause}
       LIMIT ? OFFSET ?`,
    [...searchParams, Number(limit), Number(offset)],
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM suppliers ${whereClause}`,
    searchParams,
  );

  return { suppliers: rows, total };
};

const updateSupplierById = async (id, supplierData) => {
  const columns = Object.keys(supplierData);
  const values = Object.values(supplierData);

  const setClause = columns.map((col) => `${col} = ?`).join(", ");

  await pool.query(`UPDATE suppliers SET ${setClause} WHERE id = ? `, [
    ...values,
    id,
  ]);

  return getSupplierById(id);
};

export default {
  isSupplierPhoneTaken,
  getSupplierById,
  createSupplier,
  getSuppliers,
  updateSupplierById,
};
