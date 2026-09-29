import AppError from "../errors/AppError.js";
import cookie from "../utils/cookie.js";
import jwt from "../utils/jwt.js";
import logger from "../utils/logger.js";

const createRequireAuth = (sessionValidator) => {
  return async (req, res, next) => {
    const { token, lastActivity } = req.cookies;
    if (!token) {
      logger.warn("Unauthenticated access attempt: no valid token provided");

      throw new AppError(
        "برای انجام این عملیات باید ابتدا وارد سیستم شوید",
        401,
      );
    }

    const payload = jwt.verifyToken(token);

    const admin = await sessionValidator(payload, lastActivity);

    req.admin = admin;

    cookie.setTokenCookie(res, "lastActivity", Date.now());

    next();
  };
};

export default createRequireAuth;
