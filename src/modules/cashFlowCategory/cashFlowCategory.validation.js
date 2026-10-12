import joi from "../../shared/utils/customJoi.js";

import {
  createBodyObjectSchema,
  createQuerySchema,
} from "../../shared/utils/validationHelpers.js";

const cashFlowCategoryIdParamSchema = joi
  .number()
  .integer()
  .positive()
  .required()
  .messages({
    "number.base": "شناسه دسته‌بندی باید عدد باشد.",
    "number.positive": "شناسه دسته‌بندی نامعتبر است.",
    "any.required": "شناسه دسته‌بندی الزامی است.",
  });

const addCashFlowCategory = {
  body: createBodyObjectSchema({
    title: joi.string().trim().min(3).max(125).required().messages({
      "string.base": "عنوان دسته‌بندی باید متن باشد.",
      "string.empty": "عنوان دسته‌بندی الزامی است.",
      "string.min": "عنوان دسته‌بندی باید حداقل ۳ کاراکتر باشد.",
      "string.max": "عنوان دسته‌بندی نمی‌تواند بیشتر از ۱۲۵ کاراکتر باشد.",
      "any.required": "عنوان دسته‌بندی الزامی است.",
    }),

    type: joi.string().trim().valid("INCOME", "EXPENSE").required().messages({
      "string.base": "نوع دسته‌بندی باید متن باشد.",
      "string.empty": "نوع دسته‌بندی الزامی است.",
      "any.only":
        "نوع دسته‌بندی فقط می‌تواند 'INCOME' (درآمد) یا 'EXPENSE' (هزینه) باشد.",
      "any.required": "نوع دسته‌بندی الزامی است.",
    }),
  }),
};

const getCashFlowCategories = {
  query: createQuerySchema({
    page: joi.number().integer().min(1).default(1).messages({
      "number.base": "شماره صفحه باید عدد باشد.",
      "number.min": "شماره صفحه باید حداقل ۱ باشد.",
    }),

    limit: joi.number().integer().min(1).max(100).default(20).messages({
      "number.base": "تعداد آیتم در هر صفحه باید عدد باشد.",
      "number.min": "تعداد آیتم باید حداقل ۱ باشد.",
      "number.max": "تعداد آیتم نباید بیشتر از ۱۰۰ باشد.",
    }),

    search: joi
      .string()
      .trim()
      .custom((value) => joi.persianToEnglishDigits(value))
      .max(100)
      .empty("")
      .default(null)
      .messages({
        "string.base": "عبارت جستجو باید متن باشد.",
        "string.max": "عبارت جستجو نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد.",
      }),
  }),
};

const getCashFlowCategory = {
  params: joi.object({ categoryId: cashFlowCategoryIdParamSchema }),
};

const updateCashFlowCategory = {
  params: joi.object({ categoryId: cashFlowCategoryIdParamSchema }),

  body: createBodyObjectSchema({
    title: joi.string().trim().min(3).max(125).required().messages({
      "string.base": "عنوان دسته‌بندی باید متن باشد.",
      "string.empty": "عنوان دسته‌بندی الزامی است.",
      "string.min": "عنوان دسته‌بندی باید حداقل ۳ کاراکتر باشد.",
      "string.max": "عنوان دسته‌بندی نمی‌تواند بیشتر از ۱۲۵ کاراکتر باشد.",
      "any.required": "عنوان دسته‌بندی الزامی است.",
    }),
  }),
};

const deleteCashFlowCategory = getCashFlowCategory;

export default {
  addCashFlowCategory,
  getCashFlowCategories,
  getCashFlowCategory,
  updateCashFlowCategory,
  deleteCashFlowCategory,
};
