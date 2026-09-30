import { pool } from "../../database/connection.js";

const getConnection = async () => {
  return await pool.getConnection();
};

const getPreviouslyReturnedQuantities = async (referenceInvoiceId) => {
  const query = `
    SELECT rii.product_id, SUM(rii.quantity) AS total_returned
    FROM return_invoice_items rii
    JOIN return_invoices ri ON rii.return_invoice_id = ri.id
    WHERE ri.reference_invoice_id = ? AND ri.status = 'ACTIVE'
    GROUP BY rii.product_id
  `;
  const [rows] = await pool.query(query, [referenceInvoiceId]);
  return rows;
};

const createReturnHeader = async (data, connection = pool) => {
  const {
    returnType,
    personId,
    referenceInvoiceId,
    totalQuantity,
    totalAmount,
  } = data;

  const query = `
    INSERT INTO return_invoices 
    (return_type, person_id, reference_invoice_id, total_quantity, total_amount) 
    VALUES (?, ?, ?, ?, ?)
  `;

  const [result] = await connection.query(query, [
    returnType,
    personId,
    referenceInvoiceId,
    totalQuantity,
    totalAmount,
  ]);

  return result.insertId;
};

const createReturnItem = async (returnInvoiceId, item, connection = pool) => {
  const { productId, productName, quantity, unitPrice, lineTotal } = item;

  const query = `
    INSERT INTO return_invoice_items 
    (return_invoice_id, product_id, product_name, quantity, unit_price, line_total) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  await connection.query(query, [
    returnInvoiceId,
    productId,
    productName,
    quantity,
    unitPrice,
    lineTotal,
  ]);
};

export default {
  getConnection,
  getPreviouslyReturnedQuantities,
  createReturnHeader,
  createReturnItem,
};
