import { pool } from "./connection.js";
import logger from "../shared/utils/logger.js";

const createTables = async () => {
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

  const bankAccountsTable = `
  CREATE TABLE IF NOT EXISTS bank_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    owner_name VARCHAR(120) DEFAULT NULL,
    card_number VARCHAR(20) DEFAULT NULL,
    account_number VARCHAR(50) DEFAULT NULL,
    initial_balance BIGINT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

  const productsTable = `
  CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    barcode VARCHAR(100) NOT NULL UNIQUE,
    stock INT NULL DEFAULT 0,
    purchase_price BIGINT UNSIGNED NULL,
    sale_price BIGINT UNSIGNED NULL,
    last_stock_in_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    stock_history JSON NULL DEFAULT (JSON_ARRAY())
  );
`;

  const customersTable = `
  CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) DEFAULT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    birth_month INT DEFAULT NULL,
    birth_day INT DEFAULT NULL,
    current_balance BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
`;

  const cartsTable = `
    CREATE TABLE IF NOT EXISTS carts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      items JSON NOT NULL DEFAULT (JSON_ARRAY()),
      discount_amount INT UNSIGNED NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  const salesInvoicesTable = `
  CREATE TABLE IF NOT EXISTS sales_invoices (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id INT DEFAULT NULL,
    payment_method ENUM('CASH', 'CARD', 'TRANSFER', 'CREDIT', 'MIXED') NOT NULL DEFAULT 'CASH',
    discount_amount BIGINT UNSIGNED NOT NULL DEFAULT 0,
    credit_amount BIGINT UNSIGNED NOT NULL DEFAULT 0,
    total_quantity INT UNSIGNED NOT NULL,
    total_amount BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );
`;

  const salesInvoicesItemsTable = `
  CREATE TABLE IF NOT EXISTS sales_invoices_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT UNSIGNED NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    original_price BIGINT UNSIGNED NOT NULL,
    sale_price BIGINT UNSIGNED NOT NULL,
    purchase_price BIGINT UNSIGNED NOT NULL,
    line_total BIGINT UNSIGNED NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX (invoice_id)
  );
`;

  const paymentsTable = `
  CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT DEFAULT NULL,
    person_type ENUM('CUSTOMER', 'SUPPLIER') DEFAULT NULL,
    person_id INT DEFAULT NULL,
    invoice_type ENUM('SALE', 'PURCHASE', 'SETTLEMENT_IN', 'SETTLEMENT_OUT') NOT NULL,
    invoice_id INT UNSIGNED DEFAULT NULL,
    method ENUM('CASH', 'CARD', 'TRANSFER') NOT NULL,
    amount BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (invoice_type, invoice_id),
    INDEX (person_type, person_id),
    INDEX (account_id),
    FOREIGN KEY (account_id) REFERENCES bank_accounts(id) ON DELETE RESTRICT
  );
`;

  const purchasesCartTable = `
CREATE TABLE IF NOT EXISTS purchase_carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  items JSON NOT NULL DEFAULT (JSON_ARRAY()),
  discount_amount INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

  const purchaseInvoicesTable = `
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  payment_method ENUM('CASH', 'CARD', 'TRANSFER', 'CREDIT', 'MIXED') NOT NULL DEFAULT 'CASH',
  discount_amount BIGINT UNSIGNED NOT NULL DEFAULT 0,
  credit_amount BIGINT UNSIGNED NOT NULL DEFAULT 0,
  total_quantity INT UNSIGNED NOT NULL,
  total_amount BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);
`;

  const purchaseInvoiceItemsTable = `
CREATE TABLE IF NOT EXISTS purchase_invoice_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT UNSIGNED NOT NULL,
  product_id INT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  purchase_price BIGINT UNSIGNED NOT NULL,
  line_total BIGINT UNSIGNED NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES purchase_invoices(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX (invoice_id)
);
`;

  try {
    await pool.query(adminTable);
    await pool.query(bankAccountsTable);
    await pool.query(suppliersTable);
    await pool.query(productsTable);
    await pool.query(customersTable);
    await pool.query(cartsTable);
    await pool.query(salesInvoicesTable);
    await pool.query(salesInvoicesItemsTable);
    await pool.query(paymentsTable);
    await pool.query(purchasesCartTable);
    await pool.query(purchaseInvoicesTable);
    await pool.query(purchaseInvoiceItemsTable);

    const [checkAdmin] = await pool.query(
      `SELECT COUNT(*) as count FROM admin`,
    );
    if (Number(checkAdmin[0].count) === 0) {
      const defaultAdminQuery = `INSERT INTO admin (username, password) VALUES ('admin', '$2b$10$KsELeWS4ZLKf8RWjPKfNduDo/m4TuU4gksJYVIQ6Eu/FsTZABkqFG');`;
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
