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

  backupRootDir: process.env.BACKUP_DIR,
  usbBackupRootDir: process.env.USB_BACKUP_DIR,
  usbBackupRootDir: process.env.LOG_DIR,

  kavenegar: {
    apikey: process.env.KAVENEGAR_API_KEY,
    senderNumber: process.env.KAVENEGAR_SENDER_NUMBER,
  },

  coupon: {
    general: {
      validityDays: Number(process.env.COUPON_GENERAL_VALIDITY_DAYS, 25),
      minPurchaseAmount: Number(process.env.COUPON_GENERAL_MIN_PURCHASE, 200000),
    },
    birthday: {
      validityDays: Number(process.env.COUPON_BIRTHDAY_VALIDITY_DAYS, 7),
    },
  },

  sms: {
    expireDays: Number(process.env.expire_days) || 25,
  },
};

export default config;
