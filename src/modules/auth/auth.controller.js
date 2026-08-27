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

const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  await authService.changePassword(oldPassword, newPassword);

  res.clearCookie("token", { httpOnly: true, sameSite: "strict" });
  res.clearCookie("lastActivity", { httpOnly: true, sameSite: "strict" });

  logger.info("Change password");
  return sendSuccess(
    res,
    "رمز عبور با موفقیت تغییر کرد، لطفا مجدد وارد سیستم شوید.",
  );
};

const checkAuth = async (req, res) => {
  return sendSuccess(res);
};

const logout = async (req, res) => {
  await authService.logoutAdmin();

  res.clearCookie("token", { httpOnly: true, sameSite: "strict" });
  res.clearCookie("lastActivity", { httpOnly: true, sameSite: "strict" });

  logger.info("Admin logged out");
  return sendSuccess(res, "با موفقیت از سیستم خارج شد");
};

export default { login, changePassword, checkAuth, logout };
