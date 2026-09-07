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
       (supplier_id, payment_method, discount_amount, credit_amount, total_amount, total_quantity, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
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
    item.salePrice,
    item.lineTotal,
  ]);

  await connection.query(
    `INSERT INTO purchase_invoice_items
       (invoice_id, product_id, product_name, quantity, purchase_price, sale_price, line_total)
     VALUES ?`,
    [values],
  );
};

export default { getConnection, createInvoice, createInvoiceItems };
