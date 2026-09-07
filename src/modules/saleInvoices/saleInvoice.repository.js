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

export default { getConnection, createInvoice, createInvoiceItems };
