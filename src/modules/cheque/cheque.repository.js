import { pool } from "../../database/connection.js";

const getConnection = async () => {
  return await pool.getConnection();
};

const isSerialNumberTaken = async (
  accountId,
  serialNumber,
  excludeId = null,
  connection = pool,
) => {
  let query = `
    SELECT id FROM cheques 
    WHERE account_id = ? AND serial_number = ? AND status != 'CANCELLED'
  `;
  const params = [accountId, serialNumber];

  if (excludeId) {
    query += ` AND id != ?`;
    params.push(excludeId);
  }

  query += ` LIMIT 1`;

  const [rows] = await connection.query(query, params);
  return rows.length > 0;
};

const isSayyadIdTaken = async (
  accountId,
  sayyadId,
  excludeId = null,
  connection = pool,
) => {
  let query = `
    SELECT id FROM cheques 
    WHERE account_id = ? AND sayyad_id = ? AND status != 'CANCELLED'
  `;
  const params = [accountId, sayyadId];

  if (excludeId) {
    query += ` AND id != ?`;
    params.push(excludeId);
  }

  query += ` LIMIT 1`;

  const [rows] = await connection.query(query, params);
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

const getAllCheques = async (filters) => {
  const {
    accountId,
    supplierId,
    status,
    search,
    sortBy,
    order,
    page,
    limit,
    startDate,
    endDate,
  } = filters;

  const whereClauses = [];
  const params = [];

  if (accountId) {
    whereClauses.push("c.account_id = ?");
    params.push(accountId);
  }

  if (supplierId) {
    whereClauses.push("c.supplier_id = ?");
    params.push(supplierId);
  }

  if (status) {
    whereClauses.push("c.status = ?");
    params.push(status);
  }

  if (startDate) {
    whereClauses.push("c.due_date >= ?");
    params.push(startDate);
  }

  if (endDate) {
    whereClauses.push("c.due_date <= ?");
    params.push(endDate);
  }

  if (search) {
    whereClauses.push(
      "(s.name LIKE ? OR s.phone LIKE ? OR c.serial_number LIKE ? OR c.sayyad_id LIKE ?)",
    );
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam, searchParam);
  }

  const whereClause =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const sortColumnsMap = {
    dueDate: "c.due_date",
    amount: "c.amount",
  };
  const safeSortColumn = sortColumnsMap[sortBy] || "c.due_date";
  const safeOrder = order?.toUpperCase() === "DESC" ? "DESC" : "ASC";

  const offset = (page - 1) * limit;

  const dataQuery = `
    SELECT 
      c.id,
      c.serial_number,
      c.sayyad_id,
      c.amount,
      c.due_date,
      c.status,
      s.id AS supplier_id,
      s.name AS supplier_name,
      s.phone AS supplier_phone,
      b.id AS account_id,
      b.title AS account_title
    FROM cheques c
    INNER JOIN suppliers s ON c.supplier_id = s.id
    INNER JOIN bank_accounts b ON c.account_id = b.id
    ${whereClause}
    ORDER BY ${safeSortColumn} ${safeOrder}, c.id DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM cash_flows cf
    ${whereClause}
  `;

  const [[dataResult], [countResult]] = await Promise.all([
    pool.query(dataQuery, [...params, limit, offset]),
    pool.query(countQuery, params),
  ]);

  return {
    cheques: dataResult,
    total: Number(countResult[0].total),
  };
};

const getChequeById = async (chequeId, connection = pool) => {
  const query = `
    SELECT 
      c.id,
      c.supplier_id,
      s.name AS supplier_name,
      s.phone AS supplier_phone,
      c.account_id,
      b.title AS account_title,
      c.serial_number,
      c.sayyad_id,
      c.amount,
      c.due_date,
      c.status,
      c.description,
      c.created_at,
      c.updated_at
    FROM cheques c
    INNER JOIN suppliers s ON c.supplier_id = s.id
    INNER JOIN bank_accounts b ON c.account_id = b.id
    WHERE c.id = ?
    LIMIT 1
  `;

  const [rows] = await connection.query(query, [chequeId]);

  return rows[0] || null;
};

const updateChequeById = async (chequeId, updateData, connection = pool) => {
  const fields = [];
  const params = [];

  const columnMap = {
    accountId: "account_id",
    serialNumber: "serial_number",
    sayyadId: "sayyad_id",
    dueDate: "due_date",
    description: "description",
  };

  for (const [key, column] of Object.entries(columnMap)) {
    if (updateData[key] !== undefined) {
      fields.push(`${column} = ?`);
      params.push(updateData[key]);
    }
  }

  if (fields.length === 0) return false;

  const query = `
    UPDATE cheques
    SET ${fields.join(", ")}
    WHERE id = ? AND status = 'PENDING'
  `;

  params.push(chequeId);

  const [result] = await connection.query(query, params);
  return result.affectedRows > 0;
};

const markAsCleared = async (chequeId, connection = pool) => {
  const query = `
    UPDATE cheques 
    SET status = 'CLEARED' 
    WHERE id = ? AND status = 'PENDING'
  `;
  const [result] = await connection.query(query, [chequeId]);
  return result.affectedRows > 0;
};

const markAsCancelled = async (
  chequeId,
  cancelReason = null,
  connection = pool,
) => {
  const query = `
    UPDATE cheques 
    SET 
      status = 'CANCELLED',
      description = CASE 
        WHEN ? IS NOT NULL THEN CONCAT_WS(' | علت ابطال: ', description, ?)
        ELSE description
      END
    WHERE id = ? AND status IN ('PENDING', 'CLEARED')
  `;
  const [result] = await connection.query(query, [
    cancelReason,
    cancelReason,
    chequeId,
  ]);
  return result.affectedRows > 0;
};

export default {
  getConnection,
  isSerialNumberTaken,
  isSayyadIdTaken,
  createCheque,
  getAllCheques,
  getChequeById,
  updateChequeById,
  markAsCleared,
  markAsCancelled,
};
