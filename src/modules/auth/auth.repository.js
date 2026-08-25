import crypto from "crypto";
import { pool } from "../../database/connection.js";

const getAdmin = async () => {
  const [rows] = await pool.query("SELECT * FROM admin LIMIT 1");
  return rows[0];
};

const updateAdminPassword = async (newPassword) => {
  await pool.query("UPDATE admin set password = ? WHERE id=1", [newPassword]);
  return;
};

const incrementTokenVersion = async () => {
  await pool.query(
    "UPDATE admin SET token_version = token_version + 1 WHERE id = 1;",
  );

  return true;
};

export default {
  getAdmin,
  updateAdminPassword,
  incrementTokenVersion,
};
