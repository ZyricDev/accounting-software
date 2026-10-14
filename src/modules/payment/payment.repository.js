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

export default {
  createPayments,
  deletePaymentsByInvoiceId,
  cancelPaymentsByInvoiceId,
  getPaymentsByInvoiceId,
};
