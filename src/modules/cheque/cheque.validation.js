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
      .date()
      .iso()
      .required()
      .custom((value, helpers) => {
        const original = helpers.original;

        if (original && original.length === 10) {
          return new Date(`${original}T00:00:00.000Z`);
        }
        return value;
      })
      .messages({
        "date.base": "تاریخ سررسید چک نامعتبر است.",
        "date.format": "تاریخ سررسید چک باید در فرمت استاندارد (ISO) باشد.",
        "any.required": "تاریخ سررسید چک الزامی است.",
      }),

    description: joi.string().trim().max(1000).empty("").messages({
      "string.base": "توضیحات باید متن باشد.",
      "string.max": "توضیحات نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد.",
    }),
  }),
};

export default { addCheque };
