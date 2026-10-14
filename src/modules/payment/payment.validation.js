import joi from "../../shared/utils/customJoi.js";

import {
  createBodyObjectSchema,
  createQuerySchema,
} from "../../shared/utils/validationHelpers.js";

const buildIdSchema = (label) =>
  joi
    .persianNumber()
    .integer()
    .positive()
    .empty("")
    .messages({
      "number.base": `شناسه ${label} باید عدد باشد.`,
      "number.integer": `شناسه ${label} نامعتبر است.`,
      "number.positive": `شناسه ${label} نامعتبر است.`,
      "any.required": `انتخاب ${label} الزامی است.`,
    });

const getSettlements = {
  query: createQuerySchema({
    personType: joi
      .string()
      .valid("CUSTOMER", "SUPPLIER")
      .default("SUPPLIER")
      .messages({
        "string.base": "نوع شخص باید متن باشد.",
        "any.only": "نوع شخص فقط می‌تواند 'CUSTOMER' یا 'SUPPLIER' باشد.",
      }),

    status: joi
      .string()
      .valid("ACTIVE", "CANCELLED")
      .empty("")
      .default(null)
      .messages({
        "any.only":
          "وضعیت فاکتور مرجوعی فقط می‌تواند ACTIVE یا CANCELLED باشد.",
      }),

    sortBy: joi
      .string()
      .valid("createdAt", "totalAmount")
      .default("createdAt")
      .messages({
        "string.base": "فیلد مرتب‌سازی باید یک رشته متنی باشد.",
        "any.only": "فیلد مرتب‌سازی نامعتبر است.",
      }),

    order: joi.string().valid("asc", "desc").default("desc").messages({
      "string.base": "جهت مرتب‌سازی باید یک رشته متنی باشد.",
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

    startDate: joi
      .date()
      .iso()
      .empty("")
      .default(null)
      .custom((value, helpers) => {
        const original = helpers.original;
        if (original && original.length === 10) {
          return new Date(`${original}T00:00:00.000Z`);
        }
        return value;
      })
      .messages({
        "date.base": "تاریخ شروع نامعتبر است.",
        "date.format": "تاریخ شروع باید در فرمت استاندارد (ISO) باشد.",
      }),

    endDate: joi
      .date()
      .iso()
      .min(joi.ref("startDate"))
      .empty("")
      .default(null)
      .custom((value, helpers) => {
        const original = helpers.original;
        if (original && original.length === 10) {
          return new Date(`${original}T23:59:59.999Z`);
        }
        return value;
      })
      .messages({
        "date.base": "تاریخ پایان نامعتبر است.",
        "date.format": "تاریخ پایان باید در فرمت استاندارد (ISO) باشد.",
        "date.min": "تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.",
      }),
  }),
};

const getSettlement = {
  params: joi.object({ settlementId: buildIdSchema("تراکنش") }),
};

export default { getSettlements, getSettlement };
