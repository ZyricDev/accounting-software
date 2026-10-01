import { pool } from "../../database/connection.js";

const getConnection = async () => {
  return await pool.getConnection();
};

const getPreviouslyReturnedQuantities = async (referenceInvoiceId) => {
  const query = `
    SELECT rii.product_id, SUM(rii.quantity) AS total_returned
    FROM return_invoice_items rii
    JOIN return_invoices ri ON rii.return_invoice_id = ri.id
    WHERE ri.reference_invoice_id = ? AND ri.status = 'ACTIVE'
    GROUP BY rii.product_id
  `;
  const [rows] = await pool.query(query, [referenceInvoiceId]);
  return rows;
};

const createReturnHeader = async (data, connection = pool) => {
  const {
    returnType,
    personId,
    referenceInvoiceId,
    totalQuantity,
    totalAmount,
  } = data;

  const query = `
    INSERT INTO return_invoices 
    (return_type, person_id, reference_invoice_id, total_quantity, total_amount) 
    VALUES (?, ?, ?, ?, ?)
  `;

  const [result] = await connection.query(query, [
    returnType,
    personId,
    referenceInvoiceId,
    totalQuantity,
    totalAmount,
  ]);

  return result.insertId;
};

const createReturnItem = async (returnInvoiceId, item, connection = pool) => {
  const { productId, productName, quantity, unitPrice, lineTotal } = item;

  const query = `
    INSERT INTO return_invoice_items 
    (return_invoice_id, product_id, product_name, quantity, unit_price, line_total) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  await connection.query(query, [
    returnInvoiceId,
    productId,
    productName,
    quantity,
    unitPrice,
    lineTotal,
  ]);
};

const getInvoices = async ({
  page = 1,
  limit = 20,
  sortBy = "createdAt",
  order = "desc",
  search,
  startDate,
  endDate,
  returnType,
  status,
}) => {
  const offset = (page - 1) * limit;

  const conditions = [];
  const queryParams = [];

  conditions.push("ri.return_type = ?");
  queryParams.push(returnType);

  let joinClause = "";
  let selectPerson = "";

  if (returnType === "SALE_RETURN") {
    joinClause = "LEFT JOIN customers p ON ri.person_id = p.id";
    selectPerson = "p.name AS customer_name, p.phone AS customer_phone";
  } else {
    joinClause = "LEFT JOIN suppliers p ON ri.person_id = p.id";
    selectPerson = "p.name AS supplier_name, p.phone AS supplier_phone";
  }

  if (search) {
    conditions.push(
      "(p.name LIKE ? OR p.phone LIKE ? OR ri.reference_invoice_id = ?)",
    );
    const searchTerm = `%${search}%`;
    const searchId = !isNaN(Number(search)) ? Number(search) : null;

    queryParams.push(searchTerm, searchTerm, searchId);
  }

  if (status) {
    conditions.push("ri.status = ?");
    queryParams.push(status);
  }

  if (startDate) {
    conditions.push("ri.created_at >= ?");
    queryParams.push(startDate);
  }

  if (endDate) {
    conditions.push("ri.created_at <= ?");
    queryParams.push(endDate);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sortColumnMap = {
    createdAt: "ri.created_at",
    totalAmount: "ri.total_amount",
  };
  const sortColumn = sortColumnMap[sortBy] || "ri.created_at";
  const sortDirection = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

  const dataQuery = `
    SELECT 
      ri.*, 
      ${selectPerson}
    FROM return_invoices ri
    ${joinClause}
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDirection}
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM return_invoices ri
    ${joinClause}
    ${whereClause}
  `;

  const [rows] = await pool.query(dataQuery, [
    ...queryParams,
    Number(limit),
    Number(offset),
  ]);

  const [[{ total }]] = await pool.query(countQuery, queryParams);

  return { invoices: rows, total };
};

const getReturnInvoiceById = async (id) => {
  const query = `
    SELECT 
      ri.*,
      c.name AS customer_name,
      c.phone AS customer_phone,
      s.name AS supplier_name,
      s.phone AS supplier_phone
    FROM return_invoices ri
    LEFT JOIN customers c ON ri.person_id = c.id AND ri.return_type = 'SALE_RETURN'
    LEFT JOIN suppliers s ON ri.person_id = s.id AND ri.return_type = 'PURCHASE_RETURN'
    WHERE ri.id = ?
  `;

  const [rows] = await pool.query(query, [id]);
  return rows[0] || null;
};

const getInvoiceItems = async (returnInvoiceId) => {
  const query = `
    SELECT *
    FROM return_invoice_items
    WHERE return_invoice_id = ?
  `;

  const [rows] = await pool.query(query, [returnInvoiceId]);
  return rows;
};

const cancelInvoiceStatus = async (id, connection = pool) => {
  const query = `
    UPDATE return_invoices 
    SET status = 'CANCELLED', updated_at = NOW() 
    WHERE id = ?
  `;
  await connection.query(query, [id]);
};

export default {
  getConnection,
  getPreviouslyReturnedQuantities,
  createReturnHeader,
  createReturnItem,
  getInvoices,
  getReturnInvoiceById,
  getInvoiceItems,
  cancelInvoiceStatus,
};
