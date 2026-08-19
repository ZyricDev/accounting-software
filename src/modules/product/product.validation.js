import joi from "joi";

import { createBodyObjectSchema } from "../../shared/utils/validationHelpers.js";

const addProduct = {
  body: createBodyObjectSchema({
    name: joi.string().trim().min(2).max(255).required().messages({
      "string.empty": "نام محصول الزامی است.",
      "string.min": "نام محصول باید حداقل ۲ کاراکتر باشد.",
      "string.max": "نام محصول نباید بیشتر از ۲۵۵ کاراکتر باشد.",
      "any.required": "نام محصول الزامی است.",
    }),

    barcode: joi.string().trim().min(4).max(100).required().messages({
      "string.empty": "بارکد محصول الزامی است.",
      "string.min": "بارکد وارد شده معتبر نیست.",
      "string.max": "بارکد وارد شده معتبر نیست.",
      "any.required": "بارکد محصول الزامی است.",
    }),

    purchasePrice: joi.number().integer().positive().required().messages({
      "number.base": "قیمت خرید باید عدد باشد.",
      "number.integer": "قیمت خرید نباید اعشاری باشد.",
      "number.positive": "قیمت خرید باید بیشتر از صفر باشد.",
      "any.required": "قیمت خرید الزامی است.",
    }),

    salePrice: joi.number().integer().positive().required().messages({
      "number.base": "قیمت فروش باید عدد باشد.",
      "number.integer": "قیمت فروش نباید اعشاری باشد.",
      "number.positive": "قیمت فروش باید بیشتر از صفر باشد.",
      "any.required": "قیمت فروش الزامی است.",
    }),

    stock: joi.number().integer().positive().required().messages({
      "number.base": "تعداد موجودی باید عدد باشد.",
      "number.integer": "تعداد موجودی نباید اعشاری باشد.",
      "number.positive": "تعداد موجودی باید بیشتر از صفر باشد.",
      "any.required": "تعداد موجودی الزامی است.",
    }),
  }),
};

const updateProduct = {
  body: createBodyObjectSchema({
    name: joi.string().trim().min(2).max(255).messages({
      "string.empty": "نام محصول الزامی است.",
      "string.min": "نام محصول باید حداقل ۲ کاراکتر باشد.",
      "string.max": "نام محصول نباید بیشتر از ۲۵۵ کاراکتر باشد.",
    }),

    barcode: joi.string().trim().min(4).max(100).messages({
      "string.empty": "بارکد محصول الزامی است.",
      "string.min": "بارکد وارد شده معتبر نیست.",
      "string.max": "بارکد وارد شده معتبر نیست.",
    }),

    salePrice: joi.number().integer().positive().messages({
      "number.base": "قیمت فروش باید عدد باشد.",
      "number.integer": "قیمت فروش نباید اعشاری باشد.",
      "number.positive": "قیمت فروش باید بیشتر از صفر باشد.",
    }),
  }),
};

export default { addProduct, updateProduct };
