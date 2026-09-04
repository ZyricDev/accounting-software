import joi from "joi";

import { createBodyObjectSchema } from "../../shared/utils/validationHelpers.js";

const persianToEnglishDigits = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const englishDigits = "0123456789";

  return value
    .split("")
    .map((char) => {
      const persianIndex = persianDigits.indexOf(char);
      if (persianIndex !== -1) {
        return englishDigits[persianIndex];
      }

      return char;
    })
    .join("");
};

const addSupplier = {
  body: createBodyObjectSchema({
    name: joi.string().trim().max(120).required().messages({
      "string.base": "نام تامین‌کننده باید متن باشد.",
      "string.empty": "نام تامین‌کننده الزامی است.",
      "string.max": "نام تامین‌کننده نمی‌تواند بیشتر از ۱۲۰ کاراکتر باشد.",
      "any.required": "نام تامین‌کننده الزامی است.",
    }),

    phone: joi
      .string()
      .trim()
      .required()
      .custom((value, helpers) => {
        if (typeof value !== "string") {
          return value;
        }

        return persianToEnglishDigits(value);
      })
      .pattern(/^09\d{9}$/)
      .messages({
        "string.base": "شماره تماس تامین‌کننده باید متن باشد.",
        "string.empty": "شماره تماس تامین‌کننده الزامی است.",
        "string.pattern.base": "فرمت شماره تماس نامعتبر است.",
        "any.required": "شماره تماس تامین‌کننده الزامی است.",
      }),

    address: joi.string().trim().max(255).required().messages({
      "string.base": "آدرس تامین‌کننده باید متن باشد.",
      "string.empty": "آدرس تامین‌کننده الزامی است.",
      "string.max": "آدرس تامین‌کننده نمی‌تواند بیشتر از ۲۵۵ کاراکتر باشد.",
      "any.required": "آدرس تامین‌کننده الزامی است.",
    }),
  }),
};

export default { addSupplier };
