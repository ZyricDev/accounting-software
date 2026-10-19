import { pool } from "../../database/connection.js";

const getConnection = async () => {
  return await pool.getConnection();
};

const isSerialNumberTaken = async (
  accountId,
  serialNumber,
  connection = pool,
) => {
  const query = `
    SELECT id FROM cheques 
    WHERE account_id = ? AND serial_number = ? AND status != 'CANCELLED'
    LIMIT 1
  `;

  const [rows] = await connection.query(query, [accountId, serialNumber]);

  return rows.length > 0;
};

const isSayyadIdTaken = async (accountId, sayyadId, connection = pool) => {
  const query = `
    SELECT id FROM cheques 
    WHERE account_id = ? AND sayyad_id = ? AND status != 'CANCELLED'
    LIMIT 1
  `;

  const [rows] = await connection.query(query, [accountId, sayyadId]);

  return rows.length > 0;
};

const createCheque = async (chequeData, connection = pool) => {
  const query = `
    INSERT INTO cheques (
      supplier_id, account_id, serial_number, sayyad_id, amount, due_date, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await connection.query(query, [
    chequeData.supplierId,
    chequeData.accountId,
    chequeData.serialNumber,
    chequeData.sayyadId || null,
    chequeData.amount,
    chequeData.dueDate,
    chequeData.description || null,
  ]);

  return result.insertId;
};

export default {
  getConnection,
  isSerialNumberTaken,
  isSayyadIdTaken,
  createCheque,
};
