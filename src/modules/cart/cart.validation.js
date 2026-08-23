import joi from "joi";

import { createBodyObjectSchema } from "../../shared/utils/validationHelpers.js";

const addItem = {
  body: createBodyObjectSchema({
    productId: joi
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9-]+$/)
      .required()
      .messages({
        "string.base": "شناسه محصول باید رشته باشد.",
        "string.empty": "شناسه محصول نمی‌تواند خالی باشد.",
        "string.pattern.base": "فرمت شناسه محصول نامعتبر است.",
        "any.required": "شناسه محصول الزامی است.",
      }),

    quantity: joi.number().integer().positive().default(1).messages({
      "number.base": "تعداد باید عدد باشد.",
      "number.integer": "تعداد باید یک عدد صحیح باشد.",
      "number.positive": "تعداد باید حداقل ۱ باشد.",
    }),
  }),
};

export default { addItem };
