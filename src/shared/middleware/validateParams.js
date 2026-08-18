import AppError from "../errors/AppError.js";

const validateParams = (paramName) => (req, res, next) => {
  const paramValue = req.params[paramName];

  const isValidFormat = /^[a-zA-Z0-9-]+$/.test(paramName);
  if (!isValidFormat) {
    throw new AppError(`فرمت ${paramValue} معتبر نیست`, 400);
  }

  next();
};

export default validateParams;
