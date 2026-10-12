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

const getCashFlows = async ({
  page = 1,
  limit = 20,
  categoryId = null,
  accountId = null,
  sortBy = "createdAt",
  order = "desc",
  startDate,
  endDate,
  paymentMethod,
}) => {
  const offset = (page - 1) * limit;

  const conditions = [];
  const queryParams = [];

  if (startDate) {
    conditions.push("cf.payment_date >= ?");
    queryParams.push(startDate);
  }
  if (endDate) {
    conditions.push("cf.payment_date <= ?");
    queryParams.push(endDate);
  }

  if (paymentMethod) {
    conditions.push("cf.method = ?");
    queryParams.push(paymentMethod);
  }

  if (categoryId) {
    conditions.push("cf.category_id = ?");
    queryParams.push(categoryId);
  }
  if (accountId) {
    conditions.push("cf.account_id = ?");
    queryParams.push(accountId);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sortColumnMap = {
    createdAt: "cf.payment_date",
    amount: "cf.amount",
  };
  const sortColumn = sortColumnMap[sortBy] || "cf.payment_date";
  const sortDirection = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

  const dataQuery = `
    SELECT 
      cf.id, 
      cf.amount, 
      cf.payment_method, 
      cf.payment_date AS created_at, 
      c.id AS category_id,
      c.title AS category_title,
      c.type AS flow_type
    FROM cash_flows cf
    INNER JOIN cash_flow_categories c ON cf.category_id = c.id
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDirection}
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM cash_flows cf
    ${whereClause}
  `;

  const [rows] = await pool.query(dataQuery, [
    ...queryParams,
    Number(limit),
    Number(offset),
  ]);

  const [[{ total }]] = await pool.query(countQuery, queryParams);

  return { cashFlows: rows, total };
};

export default { getConnection, getCashFlowById, createCashFlow, getCashFlows };
