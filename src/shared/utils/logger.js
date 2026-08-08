import { createLogger, format, transports } from "winston";
import config from "../../config/env.js";

const { combine, timestamp, printf, errors, colorize } = format;
const isProduction = config.app.nodeEnv === "production";

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
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
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

if (!isProduction) {
  logger.add(
    new transports.Console({
      format: combine(colorize(), customFormat),
    }),
  );
}

export default logger;
