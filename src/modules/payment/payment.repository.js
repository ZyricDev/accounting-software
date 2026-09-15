import { pool } from "../../database/connection.js";

const createPayments = async (
  { invoiceType, invoiceId, personType, personId, payments },
  executor = pool,
) => {
  const values = payments.map((p) => [
    p.accountId,
    personType,
    personId,
    invoiceType,
    invoiceId,
    p.method,
    p.amount,
  ]);

  await executor.query(
    `INSERT INTO payments (account_id, person_type, person_id, invoice_type, invoice_id, method, amount) VALUES ?`,
    [values],
  );
};

export default { createPayments };
