import joi from "joi";

import { createBodyObjectSchema } from "../../shared/utils/validationHelpers.js";

const quantitySchema = joi.number().integer().min(0).default(1).messages({
  "number.base": "تعداد باید عدد باشد.",
  "number.integer": "تعداد باید یک عدد صحیح باشد.",
  "number.min": "تعداد نمی‌تواند منفی باشد.",
});

const cartIdParamSchema = joi
  .number()
  .integer()
  .positive()
  .required()
  .messages({
    "number.base": "شناسه سبد نامعتبر است.",
    "any.required": "شناسه سبد الزامی است.",
  });

const itemIdParamSchema = joi.string().guid().required().messages({
  "string.guid": "شناسه آیتم نامعتبر است.",
  "any.required": "شناسه آیتم الزامی است.",
});

const addItem = {
  params: joi.object({ cartId: cartIdParamSchema }),
  body: createBodyObjectSchema({
    productId: joi.number().integer().positive().required().messages({
      "number.base": "شناسه محصول باید عدد باشد.",
      "number.positive": "شناسه محصول نامعتبر است.",
      "any.required": "شناسه محصول الزامی است.",
    }),
    quantity: quantitySchema,
  }),
};

const getCart = {
  params: joi.object({
    cartId: cartIdParamSchema,
  }),
};

const cartId = {
  params: joi.object({
    cartId: cartIdParamSchema,
  }),
};

const quantityItem = {
  params: joi.object({
    cartId: cartIdParamSchema,
    itemId: itemIdParamSchema,
  }),

  body: createBodyObjectSchema({ quantity: quantitySchema }),
};

const priceItem = {
  params: joi.object({
    cartId: cartIdParamSchema,
    itemId: itemIdParamSchema,
  }),

  body: createBodyObjectSchema({
    salePrice: joi.number().integer().min(0).required().messages({
      "number.base": "مبلغ قیمت باید عدد باشد.",
      "number.integer": "مبلغ قیمت باید یک عدد صحیح (بدون اعشار) باشد.",
      "number.min":
        "مبلغ قیمت نمی‌تواند منفی باشد (برای کالای رایگان یا اشانتیون عدد ۰ وارد شود).",
      "any.required": "وارد کردن مبلغ قیمت الزامی است.",
    }),
  }),
};

const deleteItem = {
  params: joi.object({
    cartId: cartIdParamSchema,
    itemId: itemIdParamSchema,
  }),
};

export default {
  addItem,
  getCart,
  cartId,
  quantityItem,
  priceItem,
  deleteItem,
};
