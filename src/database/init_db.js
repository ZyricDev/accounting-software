import { pool } from "./connection.js";
import logger from "../shared/utils/logger.js";

const createTables = async () => {
  // جدول admin
  const adminTable = `
    CREATE TABLE IF NOT EXISTS admin (
      id INT(11) AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      token_version INT(11) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  // جدول products
  const productsTable = `
    CREATE TABLE IF NOT EXISTS products (
      id INT(11) AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      barcode VARCHAR(100) NOT NULL,
      stock INT(10) UNSIGNED NOT NULL DEFAULT 0,
      purchase_price INT(10) UNSIGNED NOT NULL,
      sale_price INT(10) UNSIGNED NOT NULL,
      last_stock_in_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL DEFAULT NULL,
      stock_history LONGTEXT DEFAULT '[]',
      INDEX (deleted_at)
    );
  `;

  // جدول carts
  const cartsTable = `
    CREATE TABLE IF NOT EXISTS carts (
      id INT(11) AUTO_INCREMENT PRIMARY KEY,
      items LONGTEXT NOT NULL DEFAULT '[]',
      discountAmount BIGINT(20) UNSIGNED NOT NULL DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(adminTable);
    await pool.query(productsTable);
    await pool.query(cartsTable);

    const checkAdmin = await pool.query(`SELECT COUNT(*) as count FROM admin`);
    if (checkAdmin[0][0].count === 0) {
      const defaultAdminQuery = `
        INSERT INTO admin (username, password) 
        VALUES ('admin', '$2b$10$KsELeWS4ZLKf8RWjPKfNduDo/m4TuU4gksJYVIQ6Eu/FsTZABkqFG');
      `;
      await pool.query(defaultAdminQuery);
      logger.info(
        "👨‍💻 Default admin user created (Username: admin, Password: admin)",
      );
    }

    logger.info("✅ All database tables checked/created successfully!");
  } catch (error) {
    logger.error("❌ Error creating database tables:", {
      error: error.message,
    });
    throw error;
  }
};

export default createTables;
