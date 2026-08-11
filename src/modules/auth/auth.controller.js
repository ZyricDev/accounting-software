import authService from "./auth.service.js";
import logger from "../../shared/utils/logger.js";
import { sendSuccess } from "../../shared/utils/apiResponse.js";
import cookie from "../../shared/utils/cookie.js";

const login = async (req, res) => {
  const adminData = req.body;

  const token = await authService.login(adminData);

  cookie.setTokenCookie(res, "token", token);
  cookie.setTokenCookie(res, "lastActivity", Date.now());

  logger.info("Admin logged in");

  return sendSuccess(res, "با موفقیت وارد سیستم شد");
};

const logout = async (req, res) => {
  await authService.logoutAdmin();

  logger.info("Admin logged out");

  res.clearCookie("token", { httpOnly: true, sameSite: "strict" });
  res.clearCookie("lastActivity", { httpOnly: true, sameSite: "strict" });

  return sendSuccess(res, "با موفقیت از سیستم خارج شد");
};

export default { login, logout };
