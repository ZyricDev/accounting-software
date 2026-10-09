import { pool } from "../../database/connection.js";

const getCashFlowCategories = async () => {
  const [rows] = await pool.query(
    `SELECT id, title, type FROM cash_flow_categories`,
  );
  return rows;
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
  getCashFlowCategories,
  isTitleTaken,
  getCashFlowCategoryById,
  createCashFlowCategory,
  updateCashFlowCategoryTitle,
  deleteCategoryById,
};
