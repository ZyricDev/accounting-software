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
  getCashFlowCategory,
  updateCashFlowCategory,
  deleteCashFlowCategory,
};
