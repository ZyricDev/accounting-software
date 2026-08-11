import jwt from "jsonwebtoken";
import config from "../../config/env.js";

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

export default { generateToken };
