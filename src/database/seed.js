// database/seed.js
import { pool } from "./connection.js";

const seedAdmin = async () => {
  const [checkAdmin] = await pool.query(`SELECT COUNT(*) as count FROM admin`);
  if (Number(checkAdmin[0].count) === 0) {
    const defaultAdminQuery = `INSERT INTO admin (username, password) VALUES ('admin', '$2b$10$KsELeWS4ZLKf8RWjPKfNduDo/m4TuU4gksJYVIQ6Eu/FsTZABkqFG');`;
    await pool.query(defaultAdminQuery);
    logger.info(
      "👨‍‍💻 Default admin user created (Username: admin, Password: admin)",
    );
  }
};

const seedDefaultCustomer = async () => {
  const [checkGuest] = await pool.query(
    `SELECT id FROM customers WHERE phone = '00000000000'`,
  );

  if (checkGuest.length === 0) {
    const guestQuery = `INSERT INTO customers (name, phone, initial_balance, current_balance) VALUES ('مشتری گذری', '00000000000', 0, 0);`;
    await pool.query(guestQuery);
    logger.info("👤 Default guest customer created successfully.");
  }
};

const seedDefaultCategories = async () => {
  const defaultCategories = [
    { title: "متفرقه", type: "EXPENSE" },
    { title: "پول شاگرد", type: "EXPENSE" },
    { title: "مخارج خانه", type: "EXPENSE" },
    { title: "قبوض و شارژ", type: "EXPENSE" },
    { title: "کرایه بار", type: "EXPENSE" },
    { title: "سود بانکی", type: "INCOME" },
    { title: "درآمد متفرقه", type: "INCOME" },
  ];

  for (const cat of defaultCategories) {
    await pool.query(
      `INSERT IGNORE INTO cash_flow_categories (title, type) VALUES (?, ?)`,
      [cat.title, cat.type],
    );
  }
};

export const runAllSeeds = async () => {
  try {
    await Promise.all([
      seedAdmin(),
      seedDefaultCustomer(),
      seedDefaultCategories(),
    ]);

    console.log("Seed data created successfully.");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
};
