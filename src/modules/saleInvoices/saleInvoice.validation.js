import joi from "../../shared/utils/customJoi.js";

import { createBodyObjectSchema } from "../../shared/utils/validationHelpers.js";

const checkout = {
  params: joi.object({
    cartId: joi.persianNumber().integer().positive().required().messages({
      "number.base": "شناسه سبد باید عدد باشد.",
      "number.positive": "شناسه سبد نامعتبر است.",
      "any.required": "شناسه سبد الزامی است.",
    }),
  }),

  body: createBodyObjectSchema({
    cashAmount: joi
      .persianNumber()
      .integer()
      .min(0)
      .empty("")
      .default(0)
      .messages({
        "number.base": "مبلغ نقدی باید عدد باشد.",
        "number.min": "مبلغ نقدی نمی‌تواند منفی باشد.",
      }),

    electronicAmount: joi
      .persianNumber()
      .integer()
      .min(0)
      .empty("")
      .default(0)
      .messages({
        "number.base": "مبلغ کارت/پز باید عدد باشد.",
        "number.min": "مبلغ کارت/پز نمی‌تواند منفی باشد.",
      }),

    creditAmount: joi
      .persianNumber()
      .integer()
      .min(0)
      .empty("")
      .default(0)
      .messages({
        "number.base": "مبلغ نسیه باید عدد باشد.",
        "number.min": "مبلغ نسیه نمی‌تواند منفی باشد.",
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
      .custom((value) =>
        value === null ? value : joi.persianToEnglishDigits(value),
      )
      .pattern(/^09\d{9}$/)
      .when("creditAmount", {
        is: joi.persianNumber().greater(0),
        then: joi.required().messages({
          "any.required":
            "برای فروش نسیه، وارد کردن شماره تماس مشتری الزامی است.",
        }),
      })
      .messages({
        "string.base": "شماره تماس مشتری باید متن باشد.",
        "string.pattern.base": "فرمت شماره تماس نامعتبر است.",
      }),
  }),
};

export default { checkout };
