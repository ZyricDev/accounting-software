import joi from "joi";

import {
  createBodyObjectSchema,
  createQuerySchema,
} from "../../shared/utils/validationHelpers.js";

const ALLOWED_SORT_FIELDS = [
  "name",
  "stock",
  "purchasePrice",
  "salePrice",
  "lastStockInAt",
];

const getProducts = {
  query: createQuerySchema({
    sortBy: joi
      .string()
      .valid(...ALLOWED_SORT_FIELDS)
      .default("stock")
      .messages({
        "string.base": "فیلد مرتب‌سازی (sortBy) باید یک رشته متنی باشد.",
        "any.only": "فیلد مرتب‌سازی نامعتبر است. مقادیر مجاز: {#valids}",
      }),

    order: joi.string().valid("asc", "desc").default("desc").messages({
      "string.base": "جهت مرتب‌سازی (order) باید یک رشته متنی باشد.",
      "any.only":
        "جهت مرتب‌سازی نامعتبر است و فقط می‌تواند 'asc' یا 'desc' باشد.",
    }),

    page: joi.number().integer().min(1).default(1).messages({
      "number.base": "شماره صفحه باید عدد باشد.",
      "number.min": "شماره صفحه باید حداقل ۱ باشد.",
    }),

    limit: joi.number().integer().min(1).max(100).default(20).messages({
      "number.base": "تعداد آیتم در هر صفحه باید عدد باشد.",
      "number.min": "تعداد آیتم باید حداقل ۱ باشد.",
      "number.max": "تعداد آیتم نباید بیشتر از ۱۰۰ باشد.",
    }),

    search: joi.string().trim().max(100).empty("").default(null).messages({
      "string.base": "عبارت جستجو باید متن باشد.",
      "string.max": "عبارت جستجو نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد.",
    }),
  }),
};

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

export default { getProducts, addProduct, updateProduct };
