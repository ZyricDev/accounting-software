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

const purchasePriceItem = {
  params: joi.object({
    itemId: itemIdParamSchema,
  }),

  body: createBodyObjectSchema({
    purchasePrice: joi.persianNumber().integer().min(0).required().messages({
      "number.base": "قیمت خرید باید عدد باشد.",
      "number.integer": "قیمت خرید باید یک عدد صحیح (بدون اعشار) باشد.",
      "number.min": "قیمت خرید نمی‌تواند منفی باشد.",
      "any.required": "وارد کردن قیمت خرید الزامی است.",
    }),
  }),
};

const salePriceItem = {
  params: joi.object({
    itemId: itemIdParamSchema,
  }),

  body: createBodyObjectSchema({
    salePrice: joi.persianNumber().integer().min(0).required().messages({
      "number.base": "قیمت فروش باید عدد باشد.",
      "number.integer": "قیمت فروش باید یک عدد صحیح (بدون اعشار) باشد.",
      "number.min": "قیمت فروش نمی‌تواند منفی باشد.",
      "any.required": "وارد کردن قیمت فروش الزامی است.",
    }),
  }),
};

export default {
  addItem,
  deleteItem,
  quantityItem,
  purchasePriceItem,
  salePriceItem,
};
