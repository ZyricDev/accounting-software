const config = {
  app: {
    port: process.env.PORT || 4000,
    nodeEnv: process.env.NODE_ENV || "development",
  },

  auth: {
    tokenSecretKey: process.env.TOKEN_SECRET_KEY,
    tokenExpiresInHour: process.env.TOKEN_EXPIRES_IN_Hour || 8, //h
    idleLimitMinutes: process.env.IDLE_LIMIT_MINUTES || 10, //m
  },

  DB: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },

  backupRootDir: process.env.BACKUP_DIR
};

export default config;
