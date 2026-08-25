import app from "./app.js";
import config from "./config/env.js";
import { testConnection } from "./database/connection.js";

const connectToDB = async () => {
   try {
    await testConnection();

  } catch (err) {
    console.error("❌ Failed to connect to database:", err.message);
    process.exit(1);
  }
};

const startServer = () => {
  const port = config.app.port;
  const mode =
    config.app.nodeEnv === "production" ? "production" : "development";

  app.listen(port, () => {
    console.log(`🚀 Server running in ${mode} mode on port ${port}`);
  });
};

async function run() {
  await connectToDB();
  startServer();
}

run();
