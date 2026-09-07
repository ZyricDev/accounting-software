import joi from "../../shared/utils/customJoi.js";

import { createBodyObjectSchema } from "../../shared/utils/validationHelpers.js";

const checkout = {
  body: createBodyObjectSchema({
    supplierId: joi.persianNumber().integer().positive().required().messages({
      "number.base": "شناسه تامین‌کننده باید عدد باشد.",
      "number.positive": "شناسه تامین‌کننده نامعتبر است.",
      "any.required": "انتخاب تامین‌کننده الزامی است.",
    }),

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
  }),
};

export default { checkout };
