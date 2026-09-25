import { pool } from "../../database/connection.js";

const getConnection = async () => {
  return await pool.getConnection();
};

const createInvoice = async (invoiceData, executor = pool) => {
  const {
    customerId,
    paymentMethod,
    discountAmount,
    creditAmount,
    totalAmount,
    totalQuantity,
  } = invoiceData;

  const [result] = await executor.query(
    `INSERT INTO sales_invoices
    (customer_id, payment_method, discount_amount, credit_amount, total_amount, total_quantity)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
      customerId,
      paymentMethod,
      discountAmount,
      creditAmount,
      totalAmount,
      totalQuantity,
    ],
  );

  return result.insertId;
};

const createInvoiceItems = async (invoiceId, items, executor = pool) => {
  const values = items.map((item) => [
    invoiceId,
    item.productId,
    item.productName,
    item.quantity,
    item.originalPrice,
    item.salePrice,
    item.purchasePrice,
    item.lineTotal,
  ]);

  await executor.query(
    `INSERT INTO sales_invoices_items
    (invoice_id, product_id, product_name, quantity, original_price, sale_price, purchase_price, line_total)
    VALUES ?`,
    [values],
  );
};

const getInvoices = async ({
  page = 1,
  limit = 20,
  sortBy = "createdAt",
  order = "desc",
  search,
  startDate,
  endDate,
  paymentMethod,
}) => {
  const offset = (page - 1) * limit;

  const conditions = [];
  const queryParams = [];

  if (search) {
    conditions.push("(c.name LIKE ? OR c.phone LIKE ?)");
    const searchTerm = `%${search}%`;
    queryParams.push(searchTerm, searchTerm);
  }

  if (startDate) {
    conditions.push("si.created_at >= ?");
    queryParams.push(startDate);
  }

  if (endDate) {
    conditions.push("si.created_at <= ?");
    queryParams.push(endDate);
  }

  if (paymentMethod) {
    conditions.push("si.payment_method = ?");
    queryParams.push(paymentMethod);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sortColumnMap = {
    createdAt: "si.created_at",
    totalAmount: "si.total_amount",
  };
  const sortColumn = sortColumnMap[sortBy] || "si.created_at";
  const sortDirection = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

  const dataQuery = `
    SELECT 
      si.*, 
      c.name AS customer_name, 
      c.phone AS customer_phone
    FROM sales_invoices si
    LEFT JOIN customers c ON si.customer_id = c.id
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDirection}
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM sales_invoices si
    LEFT JOIN customers c ON si.customer_id = c.id
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

const getSaleInvoiceById = async (id) => {
  const query = `
    SELECT 
      si.*, 
      c.name AS customer_name, 
      c.phone AS customer_phone
    FROM sales_invoices si
    LEFT JOIN customers c ON si.customer_id = c.id
    WHERE si.id = ?
  `;

  const [rows] = await pool.query(query, [id]);
  return rows[0] || null;
};

const getInvoiceItems = async (invoiceId) => {
  const query = `
    SELECT * 
    FROM sales_invoices_items 
    WHERE invoice_id = ?
  `;

  const [rows] = await pool.query(query, [invoiceId]);
  return rows;
};

export default {
  getConnection,
  createInvoice,
  createInvoiceItems,
  getInvoices,
  getSaleInvoiceById,
  getInvoiceItems,
};
