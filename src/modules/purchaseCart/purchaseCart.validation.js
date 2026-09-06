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

export default { addItem, deleteItem };
