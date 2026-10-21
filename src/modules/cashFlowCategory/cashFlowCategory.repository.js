import { pool } from "../../database/connection.js";

const getCashFlowCategories = async ({ search, limit = 20, page = 1 }) => {
  const offset = (page - 1) * limit;

  const whereClause = search ? "WHERE title LIKE ?" : "";
  const searchParams = search ? [`%${search}%`] : [];

  const [rows] = await pool.query(
    `SELECT id, title, type FROM cash_flow_categories
     ${whereClause}
     ORDER BY id DESC
     LIMIT ? OFFSET ?`,
    [...searchParams, Number(limit), Number(offset)],
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM cash_flow_categories ${whereClause}`,
    searchParams,
  );

  return { cashFlowCategories: rows, total };
};

const isTitleTaken = async (title, excludeId = null) => {
  let query = "SELECT id FROM cash_flow_categories WHERE title = ?";
  const params = [title];

  if (excludeId) {
    query += " AND id != ?";
    params.push(excludeId);
  }

  const [rows] = await pool.query(query, params);

  return rows.length > 0;
};

const checkCategoryUsage = async (id) => {
  const [cashFlow] = await pool.query(
    "SELECT id FROM cash_flows WHERE category_id = ? LIMIT 1",
    [id],
  );

  return cashFlow.length > 0;
};

const getCashFlowCategoryById = async (id) => {
  const [rows] = await pool.query(
    "SELECT id, title, type FROM cash_flow_categories WHERE id= ?",
    [id],
  );

  const CashFlowCategory = rows[0];
  if (!CashFlowCategory) {
    return null;
  }

  return CashFlowCategory;
};

const createCashFlowCategory = async ({ title, type }) => {
  const [rows] = await pool.query(
    `INSERT INTO cash_flow_categories (title, type) VALUES (?, ?)`,
    [title, type],
  );

  return getCashFlowCategoryById(rows.insertId);
};

const updateCashFlowCategoryTitle = async (id, title) => {
  await pool.query("UPDATE cash_flow_categories SET title = ? WHERE id = ?", [
    title,
    id,
  ]);

  return getCashFlowCategoryById(id);
};

const deleteCategoryById = async (id) => {
  const [result] = await pool.query(
    "DELETE FROM cash_flow_categories WHERE id = ?",
    [id],
  );

  return result.affectedRows > 0;
};

export default {
  getCashFlowCategories,
  isTitleTaken,
  checkCategoryUsage,
  getCashFlowCategoryById,
  createCashFlowCategory,
  updateCashFlowCategoryTitle,
  deleteCategoryById,
};
