import joi from "../../shared/utils/customJoi.js";

import {
  createBodyObjectSchema,
  createQuerySchema,
} from "../../shared/utils/validationHelpers.js";

const supplierIdParamSchema = joi
  .number()
  .integer()
  .positive()
  .required()
  .messages({
    "number.base": "شناسه تامین کننده باید عدد باشد.",
    "number.positive": "شناسه تامین کننده نامعتبر است.",
    "any.required": "شناسه تامین کننده الزامی است.",
  });

const buildPaymentMethodSchema = (label) =>
  joi
    .object({
      amount: joi
        .persianNumber()
        .integer()
        .min(0)
        .empty("")
        .default(0)
        .messages({
          "number.base": `مبلغ ${label} باید عدد باشد.`,
          "number.min": `مبلغ ${label} نمی‌تواند منفی باشد.`,
        }),

      accountId: joi
        .persianNumber()
        .integer()
        .positive()
        .empty("")
        .default(null)
        .messages({
          "number.base": `شناسه حساب/دستگاه ${label} باید عدد باشد.`,
          "number.positive": `شناسه حساب/دستگاه ${label} نامعتبر است.`,
        }),
    })
    .custom((value, helpers) => {
      const hasAmount = value.amount > 0;
      const hasAccount = value.accountId !== null;

      if (hasAmount !== hasAccount) {
        return helpers.error("object.paymentMismatch");
      }

      return value;
    })
    .messages({
      "object.paymentMismatch": `برای پرداخت با ${label}، باید هم مبلغ و هم حساب مقصد را مشخص کنید.`,
    })
    .default({ amount: 0, accountId: null });

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
      .custom((value) => joi.persianToEnglishDigits(value))
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
  params: joi.object({ supplierId: supplierIdParamSchema }),
};

const updateSupplier = {
  params: joi.object({ supplierId: supplierIdParamSchema }),

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
        return joi.persianToEnglishDigits(value);
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

const settlementSupplier = {
  params: joi.object({ supplierId: supplierIdParamSchema }),

  body: createBodyObjectSchema({
    cashAmount: joi
      .persianNumber()
      .integer()
      .min(0)
      .empty("")
      .default(0)
      .messages({
        "number.base": "مبلغ نقدی باید عدد باشد.",
        "number.min": "مبلغ نقدی نمی‌تواند منفی باشد.",
      }),

    pos: buildPaymentMethodSchema("کارت‌خوان"),

    transfer: buildPaymentMethodSchema("کارت به کارت"),

    type: joi
      .string()
      .trim()
      .valid("SETTLEMENT_IN", "SETTLEMENT_OUT")
      .required()
      .messages({
        "string.base": "نوع تسویه باید متن باشد.",
        "any.required": "فرستادن نوع تسویه الزامیست",
        "any.only":
          "نوع تسویه نامعتبر است و فقط می‌تواند 'SETTLEMENT_IN' (دریافت وجه) یا 'SETTLEMENT_OUT' (پرداخت وجه) باشد.",
      }),
  })
    .custom((value, helpers) => {
      const totalPaid =
        value.cashAmount + value.pos.amount + value.transfer.amount;

      if (totalPaid <= 0) {
        return helpers.error("object.noPaymentProvided");
      }

      return value;
    })
    .messages({
      "object.noPaymentProvided":
        "حداقل باید یکی از روش‌های پرداخت (نقدی، کارت‌خوان، کارت به کارت یا نسیه) مبلغ داشته باشد.",
    }),
};

export default {
  getSuppliers,
  addSupplier,
  getSupplier,
  updateSupplier,
  settlementSupplier,
};
