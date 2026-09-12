import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { exec } from "child_process";
import AppError from "../../shared/errors/AppError.js";
import logger from "../../shared/utils/logger.js";
import config from "../../config/env.js";

const _pad = (num) => String(num).padStart(2, "0");

const _getTodayFolderName = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    year: "numeric", month: "2-digit", day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find((p) => p.type === "year").value;
  const month = parts.find((p) => p.type === "month").value;
  const day = parts.find((p) => p.type === "day").value;
  return `${year}-${_pad(month)}-${_pad(day)}`;
};

const _getBackupFileName = () => {
  const now = new Date();
  const time = `${_pad(now.getHours())}-${_pad(now.getMinutes())}-${_pad(now.getSeconds())}`;
  const randomSuffix = crypto.randomBytes(2).toString("hex");
  return `backup-${time}-${randomSuffix}.sql`;
};

const createBackup = async () => {
  try {
    const   folderName = _getTodayFolderName();
    const fileName = _getBackupFileName();
    
    const localDayFolderPath = path.join(config.backupRootDir || "/app/backups", folderName);
    await fs.mkdir(localDayFolderPath, { recursive: true });
    const localFilePath = path.join(localDayFolderPath, fileName);

    const dumpCommand = `mysqldump -h ${config.DB.host} -u ${config.DB.user} -p${config.DB.password} ${config.DB.name} > ${localFilePath}`;

    await new Promise((resolve, reject) => {
      exec(dumpCommand, (err, stdout, stderr) => {
        if (err) {
          logger.error("❌ mysqldump failed", { error: err.message, stderr });
          return reject(err);
        }
        resolve();
      });
    });

    logger.info("✅ Local Backup created successfully", { localFilePath });

    let usbStatus = "NOT_CONFIGURED";
    if (config.usbBackupRootDir) {
      try {
        const usbDayFolderPath = path.join(config.usbBackupRootDir, folderName);
        await fs.mkdir(usbDayFolderPath, { recursive: true });
        const usbFilePath = path.join(usbDayFolderPath, fileName);
        
        await fs.copyFile(localFilePath, usbFilePath);
        logger.info("✅ Backup copied to USB successfully", { usbFilePath });
        usbStatus = "SUCCESS";
      } catch (usbError) {
        logger.warn("⚠️ Failed to copy backup to USB (Is it plugged in?)", { error: usbError.message });
        usbStatus = "FAILED";
      }
    }

    return {
      folder: folderName,
      fileName,
      status: "SUCCESS_DB_DUMP",
      usbStatus
    };
  } catch (error) {
    logger.error("❌ Failed to write backup file", { error: error.message });
    throw new AppError("ذخیره‌سازی فایل بکاپ با خطا مواجه شد", 500);
  }
};

export default { createBackup };