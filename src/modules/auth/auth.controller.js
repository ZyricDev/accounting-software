import authService from "./auth.service.js";
import logger from "../../shared/utils/logger.js";
import { sendSuccess } from "../../shared/utils/apiResponse.js";
import cookie from "../../shared/utils/cookie.js";

const login = async (req, res) => {
  const userData = req.body;

  const token = await authService.login(userData);

  cookie.setTokenCookie(res, "token", token);
  cookie.setTokenCookie(res, "lastActivity", Date.now());

  logger.info("Admin logged in");

  return sendSuccess(res, "Login successfully");
};

export default { login };
