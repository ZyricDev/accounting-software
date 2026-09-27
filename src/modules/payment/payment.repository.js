import { pool } from "../../database/connection.js";

const createPayments = async (
  { invoiceType, invoiceId, personType, personId, payments, originalDate },
  executor = pool,
) => {
  const createdAt = originalDate || new Date();

  const values = payments.map((p) => [
    p.accountId,
    personType,
    personId,
    invoiceType,
    invoiceId,
    p.method,
    p.amount,
    createdAt,
  ]);

  await executor.query(
    `INSERT INTO payments (account_id, person_type, person_id, invoice_type, invoice_id, method, amount, created_at) VALUES ?`,
    [values],
  );
};

const deletePaymentsByInvoiceId = async (
  invoiceType,
  invoiceId,
  connection = pool,
) => {
  const query = `
    DELETE FROM payments 
    WHERE invoice_type = ? AND invoice_id = ?
  `;

  const [result] = await connection.query(query, [invoiceType, invoiceId]);
  return result;
};

export default { createPayments, deletePaymentsByInvoiceId };
