import { pool } from "./connection.js";
import logger from "../shared/utils/logger.js";
import { runAllSeeds } from "./seed.js";

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
    initial_balance BIGINT NOT NULL DEFAULT 0,
    current_balance BIGINT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
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
    is_active BOOLEAN DEFAULT 1,
    birth_month INT DEFAULT NULL,
    birth_day INT DEFAULT NULL,
    initial_balance BIGINT NOT NULL DEFAULT 0,
    current_balance BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
`;

  const cartsTable = `
    CREATE TABLE IF NOT EXISTS carts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      items JSON NOT NULL DEFAULT (JSON_ARRAY()),
      discount_type ENUM('NONE', 'MANUAL', 'COUPON') DEFAULT 'NONE',
      discount_amount INT UNSIGNED NOT NULL DEFAULT 0,
      coupon_code VARCHAR(20) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  const salesInvoicesTable = `
  CREATE TABLE IF NOT EXISTS sales_invoices (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    payment_method ENUM('CASH', 'CARD', 'TRANSFER', 'CREDIT', 'MIXED') NOT NULL DEFAULT 'CASH',
    discount_type ENUM('NONE', 'MANUAL', 'COUPON') DEFAULT 'NONE',
    discount_amount BIGINT UNSIGNED NOT NULL DEFAULT 0,
    status ENUM('ACTIVE', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    credit_amount BIGINT UNSIGNED NOT NULL DEFAULT 0,
    total_quantity INT UNSIGNED NOT NULL,
    total_amount BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

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
    person_id INT NOT NULL,
    invoice_type ENUM('SALE', 'PURCHASE', 'SETTLEMENT_IN', 'SETTLEMENT_OUT') NOT NULL,
    invoice_id INT UNSIGNED DEFAULT NULL,
    method ENUM('CASH', 'CARD', 'TRANSFER') NOT NULL,
    amount BIGINT UNSIGNED NOT NULL,
    status ENUM('ACTIVE', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (account_id) REFERENCES bank_accounts(id) ON DELETE RESTRICT,

    INDEX (invoice_type, invoice_id),
    INDEX (person_type, person_id),
    INDEX (account_id)
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
  status ENUM('ACTIVE', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

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

  const returnInvoicesTable = `
    CREATE TABLE IF NOT EXISTS return_invoices (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      return_type ENUM('SALE_RETURN', 'PURCHASE_RETURN') NOT NULL,
      person_id INT NOT NULL,
      reference_invoice_id INT UNSIGNED NOT NULL,
      total_quantity INT UNSIGNED NOT NULL,
      total_amount BIGINT UNSIGNED NOT NULL,
      status ENUM('ACTIVE', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX (reference_invoice_id),
      INDEX (return_type, person_id),
      INDEX (created_at)
    );
  `;

  const returnInvoiceItemsTable = `
    CREATE TABLE IF NOT EXISTS return_invoice_items (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      return_invoice_id INT UNSIGNED NOT NULL,
      product_id INT NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      quantity INT UNSIGNED NOT NULL,
      unit_price BIGINT UNSIGNED NOT NULL,
      line_total BIGINT UNSIGNED NOT NULL,

      FOREIGN KEY (return_invoice_id) REFERENCES return_invoices(id),
      FOREIGN KEY (product_id) REFERENCES products(id),

      INDEX (return_invoice_id)
    );
  `;

  const couponsTable = `
  CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  amount BIGINT NOT NULL,
  min_purchase_amount BIGINT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX (code)
);
`;

  const cashFlowCategoriesTable = `
    CREATE TABLE IF NOT EXISTS cash_flow_categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(100) NOT NULL UNIQUE,
      type ENUM('INCOME', 'EXPENSE') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      INDEX (title)
    );
  `;

  const cashFlowsTable = `
    CREATE TABLE IF NOT EXISTS cash_flows (
      id INT AUTO_INCREMENT PRIMARY KEY,
      account_id INT DEFAULT NULL, 
      category_id INT NOT NULL,
      flow_type ENUM('INCOME', 'EXPENSE') NOT NULL,
      method ENUM('CASH', 'TRANSFER') NOT NULL,
      title VARCHAR(150) NOT NULL,
      amount BIGINT UNSIGNED NOT NULL,
      description TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (account_id) REFERENCES bank_accounts(id) ON DELETE RESTRICT,
      INDEX (account_id),
      INDEX (flow_type, created_at)
    );
  `;

  const inventoryAdjustmentsTable = `
    CREATE TABLE IF NOT EXISTS inventory_adjustments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      adjustment_type ENUM('DAMAGED', 'EXPIRED', 'TESTER', 'DEFICIT', 'SURPLUS') NOT NULL,
      quantity INT UNSIGNED NOT NULL,
      unit_cost BIGINT UNSIGNED NOT NULL, 
      total_value BIGINT UNSIGNED NOT NULL, 
      description TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (product_id) REFERENCES products(id),
      INDEX (product_id),
      INDEX (adjustment_type, created_at)
    );
  `;

  try {
    await Promise.all([
      pool.query(adminTable),
      pool.query(bankAccountsTable),
      pool.query(suppliersTable),
      pool.query(productsTable),
      pool.query(customersTable),
      pool.query(cartsTable),
      pool.query(salesInvoicesTable),
      pool.query(salesInvoicesItemsTable),
      pool.query(paymentsTable),
      pool.query(purchasesCartTable),
      pool.query(purchaseInvoicesTable),
      pool.query(purchaseInvoiceItemsTable),
      pool.query(returnInvoicesTable),
      pool.query(returnInvoiceItemsTable),
      pool.query(couponsTable),
      pool.query(cashFlowCategoriesTable),
      pool.query(cashFlowsTable),
      pool.query(inventoryAdjustmentsTable),
    ]);

    await runAllSeeds();

    logger.info("✅ All database tables checked/created successfully!");
  } catch (error) {
    logger.error("❌ Error creating database tables:", {
      error: error.message,
    });
    throw error;
  }
};

export default createTables;
