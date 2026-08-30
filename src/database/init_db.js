import { pool } from "./connection.js";
import logger from "../shared/utils/logger.js";

const createTables = async () => {
  // Admin table (single-row table — only ONE admin ever exists)
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

  // Products table
  // NOTE: barcode is intentionally NOT unique at the DB level.
  // Uniqueness among ACTIVE products is enforced in the service layer
  // (isBarcodeTaken checks WHERE barcode = ? AND deleted_at IS NULL),
  // so a soft-deleted product's barcode can be reused by a new one.
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
      stock_history LONGTEXT NOT NULL DEFAULT '[]',
      INDEX (deleted_at),
      INDEX (barcode)
    );
  `;

  // Customers table — required for invoices.customer_id FK
  const customersTable = `
    CREATE TABLE IF NOT EXISTS customers (
      id INT(11) AUTO_INCREMENT PRIMARY KEY,
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
      id INT(11) AUTO_INCREMENT PRIMARY KEY,
      items LONGTEXT NOT NULL DEFAULT '[]',
      discount_amount BIGINT(20) UNSIGNED NOT NULL DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  // Invoices table (header)
  // cart_id has NO real FK: the cart row is deleted (claimed) right before
  // the invoice is created, so a live FK would always fail. It's kept only
  // as a reference value, not a relational integrity constraint.
  const invoiceTable = `
    CREATE TABLE IF NOT EXISTS invoices (
      id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      cart_id INT(11) DEFAULT NULL,
      customer_id INT(11) DEFAULT NULL,
      payment_method ENUM('cash', 'card', 'pos') NOT NULL DEFAULT 'pos',
      total_quantity INT(10) UNSIGNED NOT NULL,
      total_amount INT(10) UNSIGNED NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
  `;

  // Invoice items table (snapshot of the sale — frozen price/name at sale time)
  // product_id MUST be signed INT(11) to match products.id's type exactly,
  // otherwise the FOREIGN KEY constraint fails to create.
  const invoiceItemsTable = `
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      invoice_id INT(11) UNSIGNED NOT NULL,
      product_id INT(11) NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      quantity INT(10) UNSIGNED NOT NULL,
      sale_price INT(10) UNSIGNED NOT NULL,
      purchase_price INT(10) UNSIGNED NOT NULL,
      line_total INT(10) UNSIGNED NOT NULL,

      FOREIGN KEY (invoice_id) REFERENCES invoices(id),
      FOREIGN KEY (product_id) REFERENCES products(id),

      INDEX (invoice_id)
    );
  `;

  try {
    // Order matters: referenced tables must exist before FK-dependent tables
    await pool.query(adminTable);
    await pool.query(productsTable);
    await pool.query(customersTable);
    await pool.query(cartsTable);
    await pool.query(invoiceTable);
    await pool.query(invoiceItemsTable);

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
