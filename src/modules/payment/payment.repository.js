import { pool } from "../../database/connection.js";

const createPayments = async (
  {
    referenceType,
    invoiceId,
    personType,
    personId,
    payments,
    originalDate,
    paymentDate = new Date(),
    description = null,
  },
  executor = pool,
) => {
  const createdAt = originalDate || new Date();

  const values = payments.map((p) => [
    p.accountId,
    personType,
    personId,
    referenceType,
    invoiceId,
    p.method,
    p.amount,
    createdAt,
    description,
    paymentDate,
  ]);

  await executor.query(
    `INSERT INTO payments (account_id, person_type, person_id, reference_type, invoice_id, method, amount, created_at, description, payment_date) VALUES ?`,
    [values],
  );
};

const deletePaymentsByInvoiceId = async (
  referenceType,
  invoiceId,
  connection = pool,
) => {
  const query = `
    DELETE FROM payments 
    WHERE reference_type = ? AND invoice_id = ?
  `;

  const [result] = await connection.query(query, [referenceType, invoiceId]);
  return result;
};

const cancelPaymentsByInvoiceId = async (
  referenceType,
  invoiceId,
  connection = pool,
) => {
  const query = `UPDATE payments SET status = 'CANCELLED' WHERE reference_type = ? AND invoice_id = ?`;
  const [result] = await connection.query(query, [referenceType, invoiceId]);
  return result;
};

const getPaymentsByInvoiceId = async (invoiceId, connection = pool) => {
  const query = `
    SELECT 
      id,
      method,
      amount,
      status,
      payment_date AS paymentDate, 
      description
    FROM payments 
    WHERE invoice_id = ?
  `;

  const [rows] = await connection.query(query, [invoiceId]);

  return rows;
};

const getSettlements = async ({
  page = 1,
  limit = 20,
  sortBy = "createdAt",
  order = "desc",
  search,
  startDate,
  endDate,
  personType,
  status,
}) => {
  const offset = (page - 1) * limit;

  const conditions = [];
  const queryParams = [];

  conditions.push("p.reference_type IN ('SETTLEMENT_IN', 'SETTLEMENT_OUT')");

  if (personType) {
    conditions.push("p.person_type = ?");
    queryParams.push(personType);
  }

  let joinClause = "";
  let selectPerson = "";
  let searchAlias = "";

  if (personType === "CUSTOMER") {
    joinClause = "LEFT JOIN customers c ON p.person_id = c.id";
    selectPerson = "c.name AS person_name, c.phone AS person_phone";
    searchAlias = "c";
  } else if (personType === "SUPPLIER") {
    joinClause = "LEFT JOIN suppliers s ON p.person_id = s.id";
    selectPerson = "s.name AS person_name, s.phone AS person_phone";
    searchAlias = "s";
  } else {
    joinClause = `
      LEFT JOIN customers c ON p.person_id = c.id AND p.person_type = 'CUSTOMER'
      LEFT JOIN suppliers s ON p.person_id = s.id AND p.person_type = 'SUPPLIER'
    `;
    selectPerson = `
      CASE 
        WHEN p.person_type = 'CUSTOMER' THEN c.name
        WHEN p.person_type = 'SUPPLIER' THEN s.name
      END AS person_name,
      CASE 
        WHEN p.person_type = 'CUSTOMER' THEN c.phone
        WHEN p.person_type = 'SUPPLIER' THEN s.phone
      END AS person_phone
    `;
  }

  if (search) {
    if (searchAlias) {
      conditions.push(
        `(${searchAlias}.name LIKE ? OR ${searchAlias}.phone LIKE ?)`,
      );
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    } else {
      conditions.push(
        `(c.name LIKE ? OR c.phone LIKE ? OR s.name LIKE ? OR s.phone LIKE ?)`,
      );
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
  }

  if (status) {
    conditions.push("p.status = ?");
    queryParams.push(status);
  }

  if (startDate) {
    conditions.push("p.payment_date >= ?");
    queryParams.push(startDate);
  }

  if (endDate) {
    conditions.push("p.payment_date <= ?");
    queryParams.push(endDate);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sortColumnMap = {
    createdAt: "p.payment_date",
    amount: "p.amount",
  };
  const sortColumn = sortColumnMap[sortBy] || "p.payment_date";
  const sortDirection = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

  const dataQuery = `
    SELECT 
      p.id, 
      p.reference_type,
      p.method,
      p.amount,
      p.status,
      p.person_id,
      p.payment_date,
      ${selectPerson}
    FROM payments p
    ${joinClause}
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDirection}
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM payments p
    ${joinClause}
    ${whereClause}
  `;

  const [rows] = await pool.query(dataQuery, [
    ...queryParams,
    Number(limit),
    Number(offset),
  ]);
  const [[{ total }]] = await pool.query(countQuery, queryParams);

  return { settlements: rows, total };
};

const getSettlementById = async (id) => {
  const query = `
    SELECT 
      p.*,
      CASE 
        WHEN p.person_type = 'CUSTOMER' THEN c.name
        WHEN p.person_type = 'SUPPLIER' THEN s.name
      END AS person_name,
      CASE 
        WHEN p.person_type = 'CUSTOMER' THEN c.phone
        WHEN p.person_type = 'SUPPLIER' THEN s.phone
      END AS person_phone,
      ba.title AS account_title
    FROM payments p
    LEFT JOIN customers c ON p.person_id = c.id AND p.person_type = 'CUSTOMER'
    LEFT JOIN suppliers s ON p.person_id = s.id AND p.person_type = 'SUPPLIER'
    LEFT JOIN bank_accounts ba ON p.account_id = ba.id
    WHERE p.id = ? AND p.reference_type IN ('SETTLEMENT_IN', 'SETTLEMENT_OUT')
  `;

  const [rows] = await pool.query(query, [id]);

  return rows[0] || null;
};

const updateSettlementById = async (id, { paymentDate, description }) => {
  const query = `
    UPDATE payments 
    SET reference_type = ?, description = ?
    WHERE id = ?
  `;

  const [result] = await pool.query(query, [
    paymentDate,
    description,
    id,
  ]);

  return result.affectedRows > 0;
};

export default {
  createPayments,
  deletePaymentsByInvoiceId,
  cancelPaymentsByInvoiceId,
  getPaymentsByInvoiceId,
  getSettlements,
  getSettlementById,
  updateSettlementById,
};
