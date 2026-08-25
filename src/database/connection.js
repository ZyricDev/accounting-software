import mysql from "mysql2/promise";

import config from "../config/env.js";

const pool = mysql.createPool({
  host: config.DB.host,
  port: config.DB.port,
  user: config.DB.user,
  password: config.DB.password,
  database: config.DB.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const testConnection = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    console.log("✅ Database connected successfully");
  } finally {
    connection.release();
  }
};

export { pool, testConnection };
