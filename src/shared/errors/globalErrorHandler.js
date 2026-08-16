import logger from "../utils/logger.js";
import config from "../../config/env.js";

const isProduction = config.app.nodeEnv === "production";

const globalErrorHandler = (err, req, res, next) => {
  const status = err.status || "error";
  const statusCode = err.statusCode || 500;
  const message = err.message;
  const errors = err.errors;

  const logDetails = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    errors: err.errors || null,
  };

  if (!isProduction) {
    logDetails.stack = err.stack;
  }

  if (statusCode >= 500) {
    logger.error(`${err.message}`, logDetails);
  } else {
    logger.warn(`${err.message}`, logDetails);
  }

  const response = {
    status,
    message:
      statusCode === 500 && !err.isOperational && isProduction
        ? "Something went wrong"
        : message,
  };

  if (errors && errors.length !== 0) {
    response.errors = errors;
  }

  if (!isProduction) {
    response.stack = err.stack;
  }

  if (err.code === "ER_DUP_ENTRY") {
    return sendError(
      res,
      "این نام یا بارکد قبلاً برای یک محصول فعال ثبت شده است",
      409,
    );
  }

  return res.status(statusCode).json(response);
};

export default globalErrorHandler;
