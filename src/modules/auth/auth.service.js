import bcrypt from "bcrypt";

import authRepository from "./auth.repository.js";
import logger from "../../shared/utils/logger.js";
import AppError from "../../shared/errors/AppError.js";
import jwt from "../../shared/utils/jwt.js";
import config from "../../config/env.js";

const _generateAuthTokens = (userObj) => {
  const tokenPayload = {
    id: userObj.id,
    role: userObj.role,
    tokenVersion: userObj.tokenVersion,
  };

  const token = jwt.generateToken(tokenPayload);

  return  token ;
};

const login = async (adminData) => {
  const { username, password } = adminData;

  const admin = await authRepository.getAdmin();
  if (!admin || admin.username !== username) {
    logger.warn("Failed login: Invalid username");

    throw new AppError("یوزرنیم یا پسورد اشتباه است", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, admin.password);
  if (!isPasswordValid) {
    logger.warn("Failed login: wrong password");

    throw new AppError("یوزرنیم یا پسورد اشتباه است", 401);
  }

  const token = _generateAuthTokens(admin);

  return token;
};

const changePassword = async (oldPassword, newPassword) => {
  const admin = await authRepository.getAdmin();

  const isPasswordValid = await bcrypt.compare(oldPassword, admin.password);
  if (!isPasswordValid) {
    logger.warn("Failed login: wrong password");

    throw new AppError("پسورد قدیمی اشتباه است", 401);
  }

  await Promise.all([
    authRepository.updateAdminPassword(newPassword),
    authRepository.incrementTokenVersion(),
  ]);

  return;
};

const logoutAdmin = async () => {
  await authRepository.incrementTokenVersion();

  return;
};

const validateSession = async (payload, lastActivity) => {
  const admin = await authRepository.getAdmin();
  if (!admin || admin.tokenVersion !== payload.tokenVersion) {
    logger.warn(
      `Revoked token used: token has version ${payload.tokenVersion}, current version is ${admin?.tokenVersion}`,
    );

    throw new AppError("ورود شما منقضی شده است، لطفاً دوباره وارد شوید", 401);
  }

  const idlMinutes = (Date.now() - Number(lastActivity)) / 60 / 1000;
  if (idlMinutes > config.auth.idleLimitMinutes) {
    throw new AppError(
      "ورود شما به دلیل عدم فعالیت منقضی شده است، لطفاً دوباره وارد شوید",
      401,
    );
  }

  return { id: admin.id, role: admin.role };
};

export default { login, logoutAdmin, changePassword, validateSession };
