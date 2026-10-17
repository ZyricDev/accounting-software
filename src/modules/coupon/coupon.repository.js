import { pool } from "../../database/connection.js";

const checkCouponExists = async (code) => {
  const [rows] = await pool.query(
    `SELECT id FROM coupons WHERE code = ? LIMIT 1`,
    [code],
  );

  return rows.length > 0;
};

const getCouponByCode = async (code) => {
  const query = `
    SELECT 
      c.*, 
      i.status AS invoice_status 
    FROM coupons c
    INNER JOIN sale_invoices i ON c.invoice_id = i.id
    WHERE c.code = ? AND c.expires_at > NOW()
  `;

  const [rows] = await pool.query(query, [code]);

  return rows[0] || null;
};

const createCoupon = async (
  { invoiceId, customerId, code, amount, minPurchase, expiresAt },
  connection = pool,
) => {
  const [result] = await connection.query(
    `INSERT INTO coupons (invoice_id, customer_id, code, amount, min_purchase_amount, expires_at) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [invoiceId, customerId, code, amount, minPurchase, expiresAt],
  );

  return result.insertId;
};

const markCouponAsUsed = async (code, usedInvoiceId, connection = pool) => {
  const query = `
    UPDATE coupons 
    SET status = 'USED', used_invoice_id = ? 
    WHERE code = ? AND status = 'ACTIVE'
  `;

  const [result] = await connection.query(query, [usedInvoiceId, code]);
  return result.affectedRows > 0;
};

const updateCouponStatus = async (filters, status, connection = pool) => {
  const { code, invoiceId, usedInvoiceId } = filters;

  let query = `UPDATE coupons SET status = ?`;
  const queryParams = [status];

  if (status === "ACTIVE") {
    query += `, used_invoice_id = NULL`;
  }

  query += ` WHERE `;

  if (code) {
    query += `code = ?`;
    queryParams.push(code);
  } else if (invoiceId) {
    query += `invoice_id = ?`;
    queryParams.push(invoiceId);
  } else if (usedInvoiceId) {
    query += `used_invoice_id = ?`;
    queryParams.push(usedInvoiceId);
  } else {
    throw new Error(
      "حداقل یکی از فیلترهای code، invoiceId یا usedInvoiceId لازم است.",
    );
  }

  const [result] = await connection.query(query, queryParams);

  return result.affectedRows > 0;
};

export default {
  checkCouponExists,
  getCouponByCode,
  createCoupon,
  markCouponAsUsed,
  updateCouponStatus,
};
