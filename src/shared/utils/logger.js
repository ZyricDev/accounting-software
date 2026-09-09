import { createLogger, format, transports } from "winston";
import config from "../../config/env.js";

const { combine, timestamp, printf, errors, colorize } = format;
const isProduction = config.app.nodeEnv === "production";

// تابع کمکی برای فرمت زمان ایران
const iranTime = () => {
  return new Date().toLocaleString("fa-IR", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

const customFormat = printf(
  ({ level, message, timestamp, stack, ...metadata }) => {
    let logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    if (stack) {
      logMessage += `\nStack: ${stack}`;
    }

    if (metadata && Object.keys(metadata).length > 0) {
      logMessage += ` | Details: ${JSON.stringify(metadata)}`;
    }

    return logMessage;
  },
);

const logger = createLogger({
  level: "info",
  format: combine(
    timestamp({ format: iranTime }), // ← اینجا تغییر کرد
    errors({ stack: true }),
  ),
  transports: [
    new transports.File({
      filename: "logs/error.log",
      level: "error",
      format: customFormat,
    }),
    new transports.File({
      filename: "logs/combined.log",
      format: customFormat,
    }),
  ],
});

logger.on("error", (err) => {
  console.error("Logger transport error:", err.message);
});

if (!isProduction) {
  logger.add(
    new transports.Console({
      format: combine(colorize(), customFormat),
    }),
  );
}

export default logger;
