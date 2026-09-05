import joi from "joi";

import {
  createBodyObjectSchema,
  createQuerySchema,
} from "../../shared/utils/validationHelpers.js";

const persianToEnglishDigits = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const englishDigits = "0123456789";

  return value
    .split("")
    .map((char) => {
      const persianIndex = persianDigits.indexOf(char);

      if (persianIndex !== -1) {
        return englishDigits[persianIndex];
      }

      return char;
    })
    .join("");
};

const supplierIdParamSchema = joi
  .number()
  .integer()
  .positive()
  .required()
  .messages({
    "number.base": "شناسه محصول باید عدد باشد.",
    "number.positive": "شناسه محصول نامعتبر است.",
    "any.required": "شناسه محصول الزامی است.",
  });

const getSuppliers = {
  query: createQuerySchema({
    balanceOrder: joi
      .string()
      .valid("most_debt", "least_debt")
      .empty("")
      .default(null)
      .messages({
        "string.base": "نوع مرتب‌سازی بدهی باید متن باشد.",
        "any.only":
          "نوع مرتب‌سازی بدهی فقط می‌تواند «most_debt» یا «least_debt» باشد.",
      }),

    page: joi.number().integer().min(1).default(1).messages({
      "number.base": "شماره صفحه باید عدد باشد.",
      "number.integer": "شماره صفحه باید یک عدد صحیح باشد.",
      "number.min": "شماره صفحه باید حداقل ۱ باشد.",
    }),

    limit: joi.number().integer().min(1).max(100).default(20).messages({
      "number.base": "تعداد آیتم در هر صفحه باید عدد باشد.",
      "number.integer": "تعداد آیتم در هر صفحه باید یک عدد صحیح باشد.",
      "number.min": "تعداد آیتم باید حداقل ۱ باشد.",
      "number.max": "تعداد آیتم نباید بیشتر از ۱۰۰ باشد.",
    }),

    search: joi.string().trim().max(100).empty("").default(null).messages({
      "string.base": "عبارت جستجو باید متن باشد.",
      "string.max": "عبارت جستجو نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد.",
    }),
  }),
};

const addSupplier = {
  body: createBodyObjectSchema({
    name: joi.string().trim().max(120).required().messages({
      "string.base": "نام تأمین‌کننده باید متن باشد.",
      "string.empty": "نام تأمین‌کننده الزامی است.",
      "string.max": "نام تأمین‌کننده نمی‌تواند بیشتر از ۱۲۰ کاراکتر باشد.",
      "any.required": "نام تأمین‌کننده الزامی است.",
    }),

    phone: joi
      .string()
      .trim()
      .required()
      .custom((value) => persianToEnglishDigits(value))
      .pattern(/^09\d{9}$/)
      .messages({
        "string.base": "شماره تماس تأمین‌کننده باید متن باشد.",
        "string.empty": "شماره تماس تأمین‌کننده الزامی است.",
        "string.pattern.base":
          "شماره تماس باید با ۰۹ شروع شود و شامل ۱۱ رقم باشد.",
        "any.required": "شماره تماس تأمین‌کننده الزامی است.",
      }),

    address: joi.string().trim().max(255).required().messages({
      "string.base": "آدرس تأمین‌کننده باید متن باشد.",
      "string.empty": "آدرس تأمین‌کننده الزامی است.",
      "string.max": "آدرس تأمین‌کننده نمی‌تواند بیشتر از ۲۵۵ کاراکتر باشد.",
      "any.required": "آدرس تأمین‌کننده الزامی است.",
    }),
  }),
};

const getSupplier = {
  params: joi.object({ id: supplierIdParamSchema }),
};

const updateSupplier = {
  params: joi.object({ id: supplierIdParamSchema }),

  body: createBodyObjectSchema({
    name: joi
      .string()
      .trim()
      .max(120)
      .empty("")
      .default(null)
      .when(joi.valid(null), {
        then: joi.strip(),
      })
      .messages({
        "string.base": "نام تأمین‌کننده باید متن باشد.",
        "string.max": "نام تأمین‌کننده نمی‌تواند بیشتر از ۱۲۰ کاراکتر باشد.",
      }),

    phone: joi
      .string()
      .trim()
      .empty("")
      .default(null)
      .custom((value) => {
        if (value === null) return value;
        return persianToEnglishDigits(value);
      })
      .pattern(/^09\d{9}$/)
      .when(joi.valid(null), {
        then: joi.strip(),
      })
      .messages({
        "string.base": "شماره تماس تأمین‌کننده باید متن باشد.",
        "string.pattern.base":
          "شماره تماس باید با ۰۹ شروع شود و شامل ۱۱ رقم باشد.",
      }),

    address: joi
      .string()
      .trim()
      .max(255)
      .empty("")
      .default(null)
      .when(joi.valid(null), {
        then: joi.strip(),
      })
      .messages({
        "string.base": "آدرس تأمین‌کننده باید متن باشد.",
        "string.max": "آدرس تأمین‌کننده نمی‌تواند بیشتر از ۲۵۵ کاراکتر باشد.",
      }),
  }),
};

export default {
  getSuppliers,
  addSupplier,
  getSupplier,
  updateSupplier,
};
