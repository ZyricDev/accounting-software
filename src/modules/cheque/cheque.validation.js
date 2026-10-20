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

const addCheque = {
  body: createBodyObjectSchema({
    supplierId: buildIdSchema("تامین‌کننده").required(),

    accountId: buildIdSchema("حساب").required(),

    serialNumber: joi
      .string()
      .trim()
      .custom((value) =>
        value === null ? value : joi.persianToEnglishDigits(value),
      )
      .min(1)
      .max(50)
      .required()
      .messages({
        "string.base": "شماره سریال چک باید متن باشد.",
        "string.empty": "شماره سریال چک الزامی است.",
        "string.min": "شماره سریال چک الزامی است.",
        "string.max": "شماره سریال چک نمی‌تواند بیشتر از ۵۰ کاراکتر باشد.",
        "any.required": "شماره سریال چک الزامی است.",
      }),

    sayyadId: joi
      .string()
      .trim()
      .custom((value) =>
        value === null ? value : joi.persianToEnglishDigits(value),
      )
      .empty("")
      .default(null)
      .pattern(/^\d{16}$/)
      .optional()
      .messages({
        "string.base": "شناسه صیاد باید متن باشد.",
        "string.pattern.base": "شناسه صیاد باید دقیقاً ۱۶ رقم عددی باشد.",
      }),

    amount: joi.persianNumber().integer().min(1).required().messages({
      "number.base": "مبلغ باید عدد باشد.",
      "number.integer": "مبلغ باید عدد صحیح باشد.",
      "number.min": "مبلغ چک باید بیشتر از صفر باشد.",
      "any.required": "مبلغ چک الزامی است.",
    }),

    dueDate: joi
      .string()
      .trim()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .custom((value, helpers) => {
        const date = new Date(`${value}T00:00:00.000Z`);

        if (
          isNaN(date.getTime()) ||
          date.toISOString().slice(0, 10) !== value
        ) {
          return helpers.error("date.invalid");
        }

        return value;
      })
      .required()
      .messages({
        "string.base": "تاریخ سررسید چک باید متن باشد.",
        "string.empty": "تاریخ سررسید چک الزامی است.",
        "string.pattern.base":
          "فرمت تاریخ سررسید چک باید به صورت YYYY-MM-DD باشد.",
        "date.invalid": "تاریخ سررسید وارد شده معتبر نیست.",
        "any.required": "تاریخ سررسید چک الزامی است.",
      }),

    description: joi.string().trim().max(1000).empty("").messages({
      "string.base": "توضیحات باید متن باشد.",
      "string.max": "توضیحات نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد.",
    }),
  }),
};

const getCheques = {
  query: createQuerySchema({
    accountId: buildIdSchema("حساب").optional(),

    supplierId: buildIdSchema("تامین‌کننده").optional(),

    status: joi
      .string()
      .valid("PENDING", "CLEARED", "CANCELLED")
      .optional()
      .messages({
        "string.base": "وضعیت چک باید یک رشته متنی باشد.",
        "any.only":
          "وضعیت چک نامعتبر است. مقادیر مجاز: PENDING, CLEARED, CANCELLED",
      }),

    search: joi
      .string()
      .trim()
      .max(100)
      .empty("")
      .default(null)
      .optional()
      .messages({
        "string.base": "عبارت جستجو باید متن باشد.",
        "string.max": "عبارت جستجو نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد.",
      }),

    sortBy: joi
      .string()
      .valid("amount", "dueDate")
      .default("dueDate")
      .messages({
        "string.base": "فیلد مرتب‌سازی (sortBy) باید یک رشته متنی باشد.",
        "any.only": "فیلد مرتب‌سازی نامعتبر است. مقادیر مجاز: amount, dueDate",
      }),

    order: joi.string().valid("asc", "desc").default("asc").messages({
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

    startDate: joi.date().iso().empty("").default(null).raw().messages({
      "date.base": "تاریخ شروع نامعتبر است.",
      "date.format": "تاریخ شروع باید در فرمت استاندارد (YYYY-MM-DD) باشد.",
    }),

    endDate: joi
      .date()
      .iso()
      .empty("")
      .default(null)
      .when("startDate", {
        is: joi.exist().not(null),
        then: joi.date().iso().min(joi.ref("startDate")),
      })
      .raw()
      .messages({
        "date.base": "تاریخ پایان نامعتبر است.",
        "date.format": "تاریخ پایان باید در فرمت استاندارد (YYYY-MM-DD) باشد.",
        "date.min": "تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.",
      }),
  }),
};

const getCheque = {
  params: joi.object({ chequeId: buildIdSchema("چک") }),
};

const updateCheque = {
  params: joi.object({ chequeId: buildIdSchema("چک").required() }),
  body: createBodyObjectSchema({
    accountId: buildIdSchema("حساب").optional(),

    serialNumber: joi.string().trim().min(1).max(50).optional().messages({
      "string.base": "شماره سریال چک باید متن باشد.",
      "string.empty": "شماره سریال چک نمی‌تواند خالی باشد.",
      "string.max": "شماره سریال چک نمی‌تواند بیشتر از ۵۰ کاراکتر باشد.",
    }),

    sayyadId: joi
      .string()
      .trim()
      .empty("")
      .default(null)
      .pattern(/^\d{16}$/)
      .optional()
      .messages({
        "string.base": "شناسه صیاد باید متن باشد.",
        "string.pattern.base": "شناسه صیاد باید دقیقاً ۱۶ رقم عددی باشد.",
      }),

    dueDate: joi
      .string()
      .trim()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .messages({
        "string.base": "تاریخ سررسید چک نامعتبر است.",
        "string.pattern.base":
          "فرمت تاریخ سررسید باید به صورت YYYY-MM-DD باشد.",
      }),

    description: joi
      .string()
      .trim()
      .max(1000)
      .empty("")
      .default(null)
      .optional()
      .messages({
        "string.base": "توضیحات باید متن باشد.",
        "string.max": "توضیحات نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد.",
      }),
  })
    .min(1)
    .messages({
      "object.min": "حداقل یک فیلد برای ویرایش باید ارسال شود.",
    }),
};

export default { addCheque, getCheques, getCheque, updateCheque };
