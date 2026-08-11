import config from "../../config/env.js";

const setTokenCookie = (res, tokenName, token) => {
  let maxAgeInMilliseconds;
  if (tokenName === "token") {
    maxAgeInMilliseconds = config.auth.tokenExpiresInHour * 60 * 60 * 1000;
  } else {
    maxAgeInMilliseconds = config.auth.idleLimitMinutes * 60 * 1000;
  }

  res.cookie(tokenName, token, {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    maxAge: maxAgeInMilliseconds,
  });
};

const getTokenCookie = (req, tokenName) => {
  return req.cookies ? req.cookies[tokenName] : null;
};

export default { setTokenCookie, getTokenCookie };
