import bcrypt from "bcrypt";

import authRepository from "./auth.repository.js";
import logger from "../../shared/utils/logger.js";
import AppError from "../../shared/errors/AppError.js";
import jwt from "../../shared/utils/jwt.js";

const _generateAuthTokens = (userObj) => {
  const tokenPayload = {
    id: userObj.id,
    role: userObj.role,
    tokenVersion: userObj.tokenVersion,
  };

  const token = jwt.generateToken(tokenPayload);

  return { token };
};

const login = async (userData) => {
  const { username, password } = userData;

  const user = await authRepository.findUserByUsername(username);
  if (!user) {
    logger.warn("Failed login: username not found");

    throw new AppError("یوزرنیم یا پسورد اشتباه است", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    logger.warn("Failed login: wrong password");

    throw new AppError("یوزرنیم یا پسورد اشتباه است", 401);
  }

  const token = _generateAuthTokens(user);

  return token;
};

export default { login };
