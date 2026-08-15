import AppError from "../errors/AppError.js";
import cookie from "../utils/cookie.js";
import jwt from "../utils/jwt.js";

const createRequireAuth = (sessionValidator) => {
  return async (req, res, next) => {
    const { token, lastActivity } = req.cookies;
    if (!token) {
      throw new AppError("لطفاً ابتدا وارد سیستم شوید", 401);
    }

    const payload = jwt.verifyToken(token);

    const admin = await sessionValidator(payload, lastActivity);

    req.admin = admin;

    cookie.setTokenCookie(res, "lastActivity", Date.now());

    next();
  };
};

export default createRequireAuth;
