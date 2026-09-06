import { pool } from "../../database/connection.js";

const createPayments = async (
  invoiceType,
  invoiceId,
  payments,
  executor = pool,
) => {
  const values = payments.map((payment) => [
    invoiceType,
    invoiceId,
    payment.method,
    payment.amount,
  ]);

  await executor.query(
    `INSERT INTO payments (invoice_type, invoice_id, method, amount) VALUES ?`,
    [values],
  );
};

export default { createPayments };
