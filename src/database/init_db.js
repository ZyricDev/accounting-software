import { pool } from "./connection.js";
import logger from "../shared/utils/logger.js";

const createTables = async () => {
  // Admin table (single-row table — only ONE admin ever exists)
  const adminTable = `
    CREATE TABLE IF NOT EXISTS admin (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      token_version INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  const suppliersTable = `
  CREATE TABLE IF NOT EXISTS suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(11) DEFAULT NULL,
    address VARCHAR(255) DEFAULT NULL,
    current_balance BIGINT NOT NULL DEFAULT 0,
    is_blocked TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (name),
    INDEX (phone)
  );
`;

  // Products table
  // NOTE: barcode is intentionally NOT unique at the DB level.
  // Uniqueness among ACTIVE products is enforced in the service layer
  // (isBarcodeTaken checks WHERE barcode = ? AND deleted_at IS NULL),
  // so a soft-deleted product's barcode can be reused by a new one.
  const productsTable = `
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      barcode VARCHAR(100) NOT NULL,
      stock INT UNSIGNED NOT NULL DEFAULT 0,
      purchase_price INT UNSIGNED NOT NULL,
      sale_price INT UNSIGNED NOT NULL,
      last_stock_in_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL DEFAULT NULL,
      stock_history LONGTEXT NOT NULL DEFAULT '[]',
      INDEX (deleted_at),
      INDEX (barcode)
    );
  `;

  // Customers table — required for invoices.customer_id FK
  const customersTable = `
    CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) DEFAULT NULL,
      phone VARCHAR(20) NOT NULL UNIQUE,
      birth_date DATE DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  // Carts table (ephemeral — deleted once checked out / "claimed")
  const cartsTable = `
    CREATE TABLE IF NOT EXISTS carts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      items JSON NOT NULL DEFAULT (JSON_ARRAY()),
      discount_amount INT UNSIGNED NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  // Invoices table (header)
  // cart_id has NO real FK: the cart row is deleted (claimed) right before
  // the invoice is created, so a live FK would always fail. It's kept only
  // as a reference value, not a relational integrity constraint.
  const salesInvoicesTable = `
    CREATE TABLE IF NOT EXISTS sales_invoices (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      cart_id INT DEFAULT NULL,
      customer_id INT DEFAULT NULL,
      payment_method ENUM('cash', 'card', 'pos') NOT NULL DEFAULT 'pos',
      total_quantity INT UNSIGNED NOT NULL,
      total_amount INT UNSIGNED NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
  `;

  // Invoice items table (snapshot of the sale — frozen price/name at sale time)
  // product_id MUST be signed INT(11) to match products.id's type exactly,
  // otherwise the FOREIGN KEY constraint fails to create.
  const salesInvoicesItemsTable = `
    CREATE TABLE IF NOT EXISTS sales_invoices_items (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      sales_invoices_id INT UNSIGNED NOT NULL,
      product_id INT NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      quantity INT UNSIGNED NOT NULL,
      sale_price INT UNSIGNED NOT NULL,
      purchase_price INT UNSIGNED NOT NULL,
      line_total INT UNSIGNED NOT NULL,

      FOREIGN KEY (sales_invoices_id) REFERENCES sales_invoices(id),
      FOREIGN KEY (product_id) REFERENCES products(id),

      INDEX (sales_invoices_id)
    );
  `;

  try {
    // Order matters: referenced tables must exist before FK-dependent tables
    await pool.query(adminTable);
    await pool.query(suppliersTable);
    await pool.query(productsTable);
    await pool.query(customersTable);
    await pool.query(cartsTable);
    await pool.query(salesInvoicesTable);
    await pool.query(salesInvoicesItemsTable);

    const [checkAdmin] = await pool.query(
      `SELECT COUNT(*) as count FROM admin`,
    );
    const adminCount = Number(checkAdmin[0].count);

    if (adminCount === 0) {
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
