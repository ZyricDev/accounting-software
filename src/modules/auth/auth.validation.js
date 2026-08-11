import joi from "joi";

import { createBodyObjectSchema } from "../../shared/utils/validationHelpers.js";

const usernameSchema = joi
  .string()
  .trim()
  .lowercase()
  .min(4)
  .max(30)
  .pattern(/^[a-zA-Z0-9_]+$/)
  .required()
  .messages({
    "string.base": "نام کاربری باید متن باشد",
    "string.empty": "نام کاربری الزامی است",
    "string.min": "نام کاربری باید حداقل ۴ کاراکتر باشد",
    "string.max": "نام کاربری نباید بیشتر از ۳۰ کاراکتر باشد",
    "string.pattern.base":
      "نام کاربری فقط می‌تواند شامل حروف، عدد و آندرلاین (_) باشد",
    "any.required": "نام کاربری الزامی است",
  });

const passwordSchema = joi.string().trim().min(5).max(64).required().messages({
  "string.base": "رمز عبور باید متن باشد",
  "string.empty": "رمز عبور الزامی است",
  "string.min": "رمز عبور باید حداقل ۵ کاراکتر باشد",
  "string.max": "رمز عبور نباید بیشتر از ۶۴ کاراکتر باشد",
  "any.required": "رمز عبور الزامی است",
});

const login = {
  body: createBodyObjectSchema({
    username: usernameSchema,
    password: passwordSchema,
  }),
};

export default {
  login,
};
