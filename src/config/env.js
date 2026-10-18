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

  melipayamak: {
    username: process.env.MELIPAYAMAK_USERNAME,
    password: process.env.MELIPAYAMAK_PASSWORD,
    purchaseDiscountPatternId:
      process.env.MELIPAYAMAK_PURCHASE_DISCOUNT_PATTERN_ID,
  },

  coupon: {
    general: {
      validityDays: Number(process.env.COUPON_GENERAL_VALIDITY_DAYS, 25),
      minPurchaseAmount: Number(
        process.env.COUPON_GENERAL_MIN_PURCHASE,
        200000,
      ),
    },
    birthday: {
      validityDays: Number(process.env.COUPON_BIRTHDAY_VALIDITY_DAYS, 7),
    },
  },
};

export default config;
