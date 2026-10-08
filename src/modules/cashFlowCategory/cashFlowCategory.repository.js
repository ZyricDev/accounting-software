import { pool } from "../../database/connection.js";

const getCashFlowCategories = async () => {
  const [rows] = await pool.query(
    `SELECT id, title, type FROM cash_flow_categories`,
  );
  return rows;
};

const isTitleTaken = async (title) => {
  const [rows] = await pool.query(
    "SELECT id FROM cash_flow_categories WHERE title= ? ",
    [title],
  );

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

export default {
  getCashFlowCategories,
  getCashFlowCategories,
  isTitleTaken,
  getCashFlowCategoryById,
  createCashFlowCategory,
};
