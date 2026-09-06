import joi from "../../shared/utils/customJoi.js";

import { createBodyObjectSchema } from "../../shared/utils/validationHelpers.js";

const itemIdParamSchema = joi.string().guid().required().messages({
  "string.guid": "شناسه آیتم نامعتبر است.",
  "any.required": "شناسه آیتم الزامی است.",
});

const addItem = {
  body: createBodyObjectSchema({
    productId: joi.persianNumber().integer().positive().required().messages({
      "number.base": "شناسه محصول باید عدد باشد.",
      "number.positive": "شناسه محصول نامعتبر است.",
      "any.required": "شناسه محصول الزامی است.",
    }),
  }),
};

const deleteItem = {
  params: joi.object({
    itemId: itemIdParamSchema,
  }),
};

const quantityItem = {
  params: joi.object({
    itemId: itemIdParamSchema,
  }),

  body: createBodyObjectSchema({
    quantity: joi.persianNumber().integer().min(1).required().messages({
      "number.base": "تعداد باید عدد باشد.",
      "number.min": "تعداد نمی‌تواند کمتر از ۱ باشد.",
      "any.required": "وارد کردن تعداد الزامی است.",
    }),
  }),
};

export default { addItem, deleteItem, quantityItem };
