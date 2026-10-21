import joi from "../../shared/utils/customJoi.js";

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

const productIdParamSchema = joi
  .persianNumber()
  .integer()
  .positive()
  .required()
  .messages({
    "number.base": "شناسه محصول باید عدد باشد.",
    "number.positive": "شناسه محصول نامعتبر است.",
    "any.required": "شناسه محصول الزامی است.",
  });

const productIdParams = {
  params: joi.object({ productId: productIdParamSchema }),
};

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

    barcodes: joi
      .array()
      .items(
        joi.string().trim().min(4).max(100).required().messages({
          "string.base": "بارکد باید متن باشد.",
          "string.empty": "بارکد نمی‌تواند خالی باشد.",
          "string.min": "طول بارکد باید حداقل ۴ کاراکتر باشد.",
          "string.max": "طول بارکد نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد.",
        }),
      )
      .min(1)
      .unique()
      .required()
      .messages({
        "array.base": "لیست بارکدها نامعتبر است.",
        "array.min": "حداقل وارد کردن یک بارکد برای محصول الزامی است.",
        "array.unique": "بارکدهای وارد شده نباید تکراری باشند.",
        "any.required": "بارکدهای محصول الزامی است.",
      }),
  }),
};

const updateProduct = {
  params: joi.object({ productId: productIdParamSchema }),

  body: createBodyObjectSchema({
    name: joi.string().trim().min(2).max(255).messages({
      "string.empty": "نام محصول الزامی است.",
      "string.min": "نام محصول باید حداقل ۲ کاراکتر باشد.",
      "string.max": "نام محصول نباید بیشتر از ۲۵۵ کاراکتر باشد.",
    }),

    barcodes: joi
      .array()
      .items(
        joi.string().trim().min(4).max(100).required().messages({
          "string.base": "بارکد باید متن باشد.",
          "string.empty": "بارکد نمی‌تواند خالی باشد.",
          "string.min": "طول بارکد باید حداقل ۴ کاراکتر باشد.",
          "string.max": "طول بارکد نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد.",
        }),
      )
      .min(1)
      .unique()
      .messages({
        "array.base": "لیست بارکدها نامعتبر است.",
        "array.min": "حداقل وارد کردن یک بارکد برای محصول الزامی است.",
        "array.unique": "بارکدهای وارد شده نباید تکراری باشند.",
      }),

    salePrice: joi.persianNumber().integer().positive().messages({
      "number.base": "قیمت فروش باید عدد باشد.",
      "number.integer": "قیمت فروش نباید اعشاری باشد.",
      "number.positive": "قیمت فروش باید بیشتر از صفر باشد.",
    }),
  })
    .min(1)
    .messages({
      "object.min": "حداقل یک فیلد برای ویرایش باید ارسال شود.",
    }),
};

const getProduct = productIdParams;
const deleteProduct = productIdParams;

export default {
  getProducts,
  addProduct,
  updateProduct,
  getProduct,
  deleteProduct,
};
