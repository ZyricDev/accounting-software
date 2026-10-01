import { pool } from "../../database/connection.js";

const getConnection = async () => {
  return await pool.getConnection();
};

const createInvoice = async (
  {
    supplierId,
    paymentMethod,
    discountAmount,
    creditAmount,
    totalAmount,
    totalQuantity,
  },
  connection,
) => {
  const [result] = await connection.query(
    `INSERT INTO purchase_invoices
       (supplier_id, payment_method, discount_amount, credit_amount, total_amount, total_quantity)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      supplierId,
      paymentMethod,
      discountAmount,
      creditAmount,
      totalAmount,
      totalQuantity,
    ],
  );

  return result.insertId;
};

const createInvoiceItems = async (invoiceId, items, connection) => {
  const values = items.map((item) => [
    invoiceId,
    item.productId,
    item.productName,
    item.quantity,
    item.purchasePrice,
    item.lineTotal,
  ]);

  await connection.query(
    `INSERT INTO purchase_invoice_items
       (invoice_id, product_id, product_name, quantity, purchase_price, line_total)
     VALUES ?`,
    [values],
  );
};

const getPurchaseInvoices = async ({
  supplierId,
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

  const conditions = ["pi.supplier_id = ?"];
  const queryParams = [supplierId];

  if (search) {
    const searchId = Number(search);
    if (!isNaN(searchId)) {
      conditions.push("pi.id = ?");
      queryParams.push(searchId);
    } else {
      conditions.push("1 = 0");
    }
  }

  if (startDate) {
    conditions.push("pi.created_at >= ?");
    queryParams.push(startDate);
  }

  if (endDate) {
    conditions.push("pi.created_at <= ?");
    queryParams.push(endDate);
  }

  if (paymentMethod) {
    conditions.push("pi.payment_method = ?");
    queryParams.push(paymentMethod);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const sortColumnMap = {
    createdAt: "pi.created_at",
    totalAmount: "pi.total_amount",
  };
  const sortColumn = sortColumnMap[sortBy] || "pi.created_at";
  const sortDirection = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

  const dataQuery = `
    SELECT 
      pi.*,
      EXISTS (
        SELECT 1 
        FROM return_invoices ri 
        WHERE ri.reference_invoice_id = pi.id 
          AND ri.return_type = 'PURCHASE_RETURN' 
          AND ri.status = 'ACTIVE'
      ) AS has_return
    FROM purchase_invoices pi
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDirection}
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM purchase_invoices pi
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

const getPurchaseInvoiceById = async (id) => {
  const query = `
    SELECT 
      pi.*, 
      s.name AS supplier_name, 
      s.phone AS supplier_phone,
      EXISTS (
        SELECT 1 
        FROM return_invoices ri 
        WHERE ri.reference_invoice_id = pi.id 
          AND ri.return_type = 'PURCHASE_RETURN' 
          AND ri.status = 'ACTIVE'
      ) AS has_return
    FROM purchase_invoices pi
    LEFT JOIN suppliers s ON pi.supplier_id = s.id
    WHERE pi.id = ?
  `;

  const [rows] = await pool.query(query, [id]);
  return rows[0] || null;
};

const getInvoiceItems = async (id) => {
  const query = `
    SELECT * 
    FROM purchase_invoice_items 
    WHERE invoice_id = ?
  `;

  const [rows] = await pool.query(query, [id]);
  return rows;
};

const cancelInvoiceStatus = async (id, connection = pool) => {
  const query = `UPDATE purchase_invoices SET status = 'CANCELLED' WHERE id = ?`;
  const [result] = await connection.query(query, [id]);
  return result;
};

const updateInvoice = async (
  invoiceId,
  { paymentMethod, discountAmount, creditAmount, totalAmount, totalQuantity },
  connection = pool,
) => {
  const query = `
    UPDATE purchase_invoices 
    SET 
      payment_method = ?, 
      discount_amount = ?, 
      credit_amount = ?, 
      total_amount = ?, 
      total_quantity = ?
    WHERE id = ?
  `;

  const params = [
    paymentMethod,
    discountAmount,
    creditAmount,
    totalAmount,
    totalQuantity,
    invoiceId,
  ];

  const [result] = await connection.query(query, params);
  return result;
};

const deleteInvoiceItems = async (id, connection = pool) => {
  const query = `
    DELETE FROM purchase_invoice_items 
    WHERE invoice_id = ?
  `;

  const [result] = await connection.query(query, [id]);
  return result;
};

export default {
  getConnection,
  createInvoice,
  createInvoiceItems,
  getPurchaseInvoices,
  getPurchaseInvoiceById,
  getInvoiceItems,
  cancelInvoiceStatus,
  updateInvoice,
  deleteInvoiceItems,
};
