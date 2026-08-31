import joi from "joi";

import { createBodyObjectSchema } from "../../shared/utils/validationHelpers.js";

const ALLOWED_PAYMENT_METHOD_FIELDS = ["cash", "card", "pos"];

const persianToEnglishDigits = (value) => {
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

const checkout = {
  params: joi.object({
    cartId: joi.number().integer().positive().required().messages({
      "number.base": "شناسه محصول باید عدد باشد.",
      "number.positive": "شناسه محصول نامعتبر است.",
      "any.required": "شناسه محصول الزامی است.",
    }),
  }),

  body: createBodyObjectSchema({
    paymentMethod: joi
      .string()
      .valid(...ALLOWED_PAYMENT_METHOD_FIELDS)
      .default("pos")
      .messages({
        "string.base": "روش پرداخت باید یک رشته متنی باشد.",
        "any.only": "روش پرداخت نامعتبر است. مقادیر مجاز: {#valids}",
      }),

    customerName: joi
      .string()
      .trim()
      .max(120)
      .empty("")
      .default(null)
      .messages({
        "string.base": "نام مشتری باید متن باشد.",
        "string.max": "نام مشتری نمی‌تواند بیشتر از ۱۲۰ کاراکتر باشد.",
      }),

    customerPhone: joi
      .string()
      .trim()
      .empty("")
      .default(null)
      .custom((value, helpers) => {
        if (value === null) {
          return value;
        }

        return persianToEnglishDigits(value);
      })
      .pattern(/^09\d{9}$/)
      .messages({
        "string.base": "شماره تماس مشتری باید متن باشد.",
        "string.pattern.base": "فرمت شماره تماس نامعتبر است.",
      }),
  }),
};

export default { checkout };
