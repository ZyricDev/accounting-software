import { pool } from "../../database/connection.js";

const isTitleTaken = async (title) => {
  const [rows] = await pool.query(
    "SELECT id FROM bank_accounts WHERE title = ?  LIMIT 1",
    [title],
  );

  return rows.length > 0;
};

const isCardNumberTaken = async (cardNumber) => {
  const [rows] = await pool.query(
    "SELECT id FROM bank_accounts WHERE card_number = ?  LIMIT 1",
    [cardNumber],
  );

  return rows.length > 0;
};

const isAccountNumberTaken = async (accountNumber) => {
  const [rows] = await pool.query(
    "SELECT id FROM bank_accounts WHERE account_number = ?  LIMIT 1",
    [accountNumber],
  );

  return rows.length > 0;
};

const getBankAccountById = async (id) => {
  const [rows] = await pool.query("SELECT * FROM bank_accounts WHERE id= ? ", [
    id,
  ]);

  const bankAccount = rows[0];
  if (!bankAccount) {
    return null;
  }

  return bankAccount;
};

const addBankAccount = async (bankAccountData) => {
  const payload = { ...bankAccountData };

  const columns = Object.keys(payload);
  const values = Object.values(payload);
  const placeholders = columns.map(() => "?").join(", ");

  const [result] = await pool.query(
    `INSERT INTO bank_accounts (${columns.join(", ")}) VALUES (${placeholders})`,
    values,
  );

  return getBankAccountById(result.insertId);
};

const getBankActiveAccounts = async () => {
  const [rows] = await pool.query(
    "SELECT id, title, card_number FROM bank_accounts WHERE is_active = 1 ORDER BY created_at DESC",
  );
  return rows;
};

const getBankAccounts = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM bank_accounts ORDER BY created_at DESC",
  );
  return rows;
};

const updateBankAccount = async (id, bankAccountData) => {
  const payload = { ...bankAccountData };

  const columns = Object.keys(payload);
  const values = Object.values(payload);
  const setClause = columns.map((col) => `${col} = ?`).join(", ");

  values.push(id);

  await pool.query(
    `UPDATE bank_accounts SET ${setClause} WHERE id = ?`,
    values,
  );

  return getBankAccountById(id);
};

const checkBankAccountUsage = async (id) => {
  const [rows] = await pool.query(
    "SELECT id FROM payments WHERE account_id = ? LIMIT 1",
    [id],
  );

  return rows.length > 0;
};

const deleteBankAccountById = async (id) => {
  await pool.query("DELETE FROM bank_accounts WHERE id = ?", [id]);
};

const updateBankAccountStatusById = async (id, status) => {
  await pool.query("UPDATE bank_accounts SET is_active = ? WHERE id = ?", [
    status,
    id,
  ]);
};

export default {
  isTitleTaken,
  isCardNumberTaken,
  isAccountNumberTaken,
  getBankAccountById,
  addBankAccount,
  getBankActiveAccounts,
  getBankAccounts,
  updateBankAccount,
  checkBankAccountUsage,
  deleteBankAccountById,
  updateBankAccountStatusById,
};
