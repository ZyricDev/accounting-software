import app from "./app.js";
import config from "./config/env.js";

const connectToDB = async () => {};

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
