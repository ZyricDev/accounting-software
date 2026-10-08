import { pool } from "../../database/connection.js";

const getCashFlowCategories = async () => {
  const [rows] = await pool.query(
    `SELECT id, title, type FROM cash_flow_categories`,
  );
  return rows;
};

export default { getCashFlowCategories };
