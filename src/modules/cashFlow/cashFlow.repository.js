import { pool } from "../../database/connection.js";

const getConnection = async () => {
  return await pool.getConnection();
};

const getCashFlowById = async (id) => {
  const [rows] = await pool.query("SELECT * FROM cash_flows WHERE id= ?", [id]);

  const CashFlow = rows[0];
  if (!CashFlow) {
    return null;
  }

  return CashFlow;
};

const createCashFlow = async (
  {
    accountId,
    categoryId,
    paymentMethod,
    amount,
    paymentDate = new Date(),
    description,
  },
  connection = pool,
) => {
  const query = `
    INSERT INTO cash_flows 
    (account_id, category_id, payment_method, amount, payment_date, description) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const values = [
    accountId,
    categoryId,
    paymentMethod,
    amount,
    paymentDate,
    description,
  ];

  const [result] = await connection.query(query, values);

  return result.insertId;
};

export default { getConnection, getCashFlowById, createCashFlow };
