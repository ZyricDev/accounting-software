import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { exec } from "child_process";
import AppError from "../../shared/errors/AppError.js";
import logger from "../../shared/utils/logger.js";
import config from "../../config/env.js";

const _pad = (num) => String(num).padStart(2, "0");

// e.g. "1405-06-09" — one folder per day (Jalali/Shamsi), reused across multiple backups
const _getTodayFolderName = () => {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(now);
  const year = parts.find((p) => p.type === "year").value;
  const month = parts.find((p) => p.type === "month").value;
  const day = parts.find((p) => p.type === "day").value;

  return `${year}-${_pad(month)}-${_pad(day)}`;
};

// e.g. "backup-14-32-05-a1b2.json" — random suffix avoids collisions
// if the button is clicked twice within the same second
const _getBackupFileName = () => {
  const now = new Date();
  const time = `${_pad(now.getHours())}-${_pad(now.getMinutes())}-${_pad(now.getSeconds())}`;
  const randomSuffix = crypto.randomBytes(2).toString("hex");
  return `backup-${time}-${randomSuffix}.sql`;
};

const createBackup = async () => {
  try {
    const dayFolderPath = path.join(
      config.backupRootDir || "/app/backups",
      _getTodayFolderName(),
    );
    await fs.mkdir(dayFolderPath, { recursive: true });

    const fileName = _getBackupFileName();
    const filePath = path.join(dayFolderPath, fileName);

    const dumpCommand = `mysqldump -h ${config.DB.host} -u ${config.DB.user} -p${config.DB.password} ${config.DB.name} > ${filePath}`;

    await new Promise((resolve, reject) => {
      exec(dumpCommand, (err, stdout, stderr) => {
        if (err) {
          logger.error("❌ mysqldump failed", { error: err.message, stderr });
          return reject(err);
        }

        resolve();
      });
    });

    logger.info("✅ Backup created successfully", { filePath });

    return {
      folder: _getTodayFolderName(),
      fileName,
      status: "SUCCESS_DB_DUMP",
    };
  } catch (error) {
    logger.error("❌ Failed to write backup file", { error: error.message });
    throw new AppError("ذخیره‌سازی فایل بکاپ با خطا مواجه شد", 500);
  }
};

export default { createBackup };
