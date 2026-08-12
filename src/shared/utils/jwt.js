import jwt from "jsonwebtoken";
import config from "../../config/env.js";
import AppError from "../errors/AppError.js";

const generateToken = (user) => {
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion,
    },
    config.auth.tokenSecretKey,
    { expiresIn: config.auth.tokenExpiresInHour + "h" },
  );

  return token;
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.auth.tokenSecretKey);
  } catch (err) {
    throw new AppError("نشست شما منقضی شده است، لطفاً دوباره وارد شوید", 401);
  }
};

export default { generateToken, verifyToken };
