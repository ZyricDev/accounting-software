import { pool } from "../../database/connection.js";

const getConnection = async () => {
  return await pool.getConnection();
};

const createInvoice = async (invoiceData, executor = pool) => {
  const { customerId, paymentMethod, totalAmount, totalQuantity } = invoiceData;

  const [result] = await executor.query(
    `INSERT INTO invoices
    (customer_id, payment_method, total_amount, total_quantity)
    VALUES (?, ?, ?, ?)`,
    [customerId, paymentMethod, totalAmount, totalQuantity],
  );

  return result.insertId;
};

const createInvoiceItems = async (invoiceId, items, executor = pool) => {
  const values = items.map((item) => [
    invoiceId,
    item.productId,
    item.productName,
    item.quantity,
    item.salePrice,
    item.purchasePrice,
    item.lineTotal,
  ]);

  await executor.query(
    `INSERT INTO invoice_items
    (invoice_id, product_id, product_name, quantity, sale_price, purchase_price, line_total)
    VALUES ?`,
    [values],
  );
};

export default { getConnection, createInvoice, createInvoiceItems };
