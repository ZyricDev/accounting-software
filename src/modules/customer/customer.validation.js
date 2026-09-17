import joi from "../../shared/utils/customJoi.js";

import {
  createBodyObjectSchema,
  createQuerySchema,
} from "../../shared/utils/validationHelpers.js";

const addCustomer = {
  body: createBodyObjectSchema({
    name: joi.string().trim().max(120).empty("").default(null).messages({
      "string.base": "نام مشتری باید متن باشد.",
      "string.max": "نام مشتری نمی‌تواند بیشتر از ۱۲۰ کاراکتر باشد.",
    }),

    phone: joi
      .string()
      .trim()
      .custom((value, helpers) => {
        return joi.persianToEnglishDigits(value);
      })
      .pattern(/^09\d{9}$/)
      .required()
      .messages({
        "string.base": "شماره تماس مشتری باید متن باشد.",
        "string.pattern.base": "فرمت شماره تماس نامعتبر است.",
        "any.required":
          " وارد کردن شماره تماس مشتری الزامی است.",
      }),

    birthMonth: joi
      .persianNumber()
      .integer()
      .min(1)
      .max(12)
      .default(null)
      .messages({
        "number.base": "ماه تولد باید به صورت عدد وارد شود.",
        "number.integer": "ماه تولد باید یک عدد صحیح باشد.",
        "number.min": "ماه تولد نمی‌تواند کمتر از ۱ باشد.",
        "number.max": "ماه تولد نمی‌تواند بیشتر از ۱۲ باشد.",
      }),

    birthDay: joi
      .persianNumber()
      .integer()
      .min(1)
      .max(31)
      .default(null)
      .messages({
        "number.base": "روز تولد باید به صورت عدد وارد شود.",
        "number.integer": "روز تولد باید یک عدد صحیح باشد.",
        "number.min": "روز تولد نمی‌تواند کمتر از ۱ باشد.",
        "number.max": "روز تولد نمی‌تواند بیشتر از ۳۱ باشد.",
      }),
  }),
};

export default { addCustomer };
