import path from "path";

import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import config from "../../config/env.js";

const { combine, timestamp, printf, errors, colorize } = format;

const isProduction = config.app.nodeEnv === "production";
const logDirectory = config.logRootDir || path.join(process.cwd(), "logs");

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

const dailyRotateErrorTransport = new DailyRotateFile({
  dirname: path.join(logDirectory),
  filename: "%DATE%-error.log",
  datePattern: "YYYY-MM-DD",
  level: "error",
  maxFiles: "20d",
  format: customFormat,
});

const dailyRotateCombinedTransport = new DailyRotateFile({
  dirname: path.join(logDirectory),
  filename: "%DATE%-combined.log",
  datePattern: "YYYY-MM-DD",
  maxFiles: "20d",
  format: customFormat,
});

const logger = createLogger({
  level: "info",
  format: combine(timestamp({ format: iranTime }), errors({ stack: true })),
  transports: [dailyRotateErrorTransport, dailyRotateCombinedTransport],
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
