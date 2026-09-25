import joi from "../../shared/utils/customJoi.js";

import {
  createBodyObjectSchema,
  createQuerySchema,
} from "../../shared/utils/validationHelpers.js";

const ALLOWED_SORT_FIELDS = ["name", "currentBalance"];

const customerIdParamSchema = joi
  .number()
  .integer()
  .positive()
  .required()
  .messages({
    "number.base": "شناسه مشتری باید عدد باشد.",
    "number.positive": "شناسه مشتری نامعتبر است.",
    "any.required": "شناسه مشتری الزامی است.",
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

const addCustomer = {
  body: createBodyObjectSchema({
    name: joi.string().trim().max(120).empty("").default(null).messages({
      "string.base": "نام مشتری باید متن باشد.",
      "string.max": "نام مشتری نمی‌تواند بیشتر از ۱۲۰ کاراکتر باشد.",
    }),

    phone: joi
      .string()
      .trim()
      .custom((value, helpers) => {
        return joi.persianToEnglishDigits(value);
      })
      .pattern(/^09\d{9}$/)
      .required()
      .messages({
        "string.base": "شماره تماس مشتری باید متن باشد.",
        "string.pattern.base": "فرمت شماره تماس نامعتبر است.",
        "any.required": " وارد کردن شماره تماس مشتری الزامی است.",
      }),

    birthMonth: joi
      .persianNumber()
      .integer()
      .min(1)
      .max(12)
      .default(null)
      .messages({
        "number.base": "ماه تولد باید به صورت عدد وارد شود.",
        "number.integer": "ماه تولد باید یک عدد صحیح باشد.",
        "number.min": "ماه تولد نمی‌تواند کمتر از ۱ باشد.",
        "number.max": "ماه تولد نمی‌تواند بیشتر از ۱۲ باشد.",
      }),

    birthDay: joi
      .persianNumber()
      .integer()
      .min(1)
      .max(31)
      .default(null)
      .messages({
        "number.base": "روز تولد باید به صورت عدد وارد شود.",
        "number.integer": "روز تولد باید یک عدد صحیح باشد.",
        "number.min": "روز تولد نمی‌تواند کمتر از ۱ باشد.",
        "number.max": "روز تولد نمی‌تواند بیشتر از ۳۱ باشد.",
      }),

    initialBalance: joi
      .object({
        amount: joi
          .persianNumber()
          .integer()
          .min(0)
          .empty("")
          .default(0)
          .messages({
            "number.base": "مبلغ مانده اولیه باید عدد باشد.",
            "number.integer": "مبلغ مانده اولیه باید عدد صحیح باشد.",
            "number.min": "مبلغ مانده اولیه نمی‌تواند منفی باشد.",
          }),
        type: joi
          .string()
          .trim()
          .valid("DEBT", "CREDIT")
          .default("DEBT")
          .messages({
            "string.base": "نوع مانده اولیه باید متن باشد.",
            "any.only":
              "نوع مانده اولیه فقط می‌تواند 'DEBT' (بدهی) یا 'CREDIT' (طلب) باشد.",
          }),
      })
      .default({ amount: 0, type: "DEBT" })
      .messages({
        "object.base": "اطلاعات مانده اولیه باید به صورت یک شیء ارسال شود.",
      }),
  }),
};

const getCustomers = {
  query: createQuerySchema({
    sortBy: joi
      .string()
      .valid(...ALLOWED_SORT_FIELDS)
      .default("name")
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

const getCustomer = {
  params: joi.object({ customerId: customerIdParamSchema }),
};

const updateCustomer = {
  params: joi.object({ customerId: customerIdParamSchema }),

  body: createBodyObjectSchema({
    name: joi.string().trim().max(120).messages({
      "string.base": "نام مشتری باید متن باشد.",
      "string.max": "نام مشتری نمی‌تواند بیشتر از ۱۲۰ کاراکتر باشد.",
    }),

    phone: joi
      .string()
      .trim()
      .custom((value, helpers) => {
        return joi.persianToEnglishDigits(value);
      })
      .pattern(/^09\d{9}$/)
      .messages({
        "string.base": "شماره تماس مشتری باید متن باشد.",
        "string.pattern.base": "فرمت شماره تماس نامعتبر است.",
      }),

    birthMonth: joi.persianNumber().integer().min(1).max(12).messages({
      "number.base": "ماه تولد باید به صورت عدد وارد شود.",
      "number.integer": "ماه تولد باید یک عدد صحیح باشد.",
      "number.min": "ماه تولد نمی‌تواند کمتر از ۱ باشد.",
      "number.max": "ماه تولد نمی‌تواند بیشتر از ۱۲ باشد.",
    }),

    birthDay: joi.persianNumber().integer().min(1).max(31).messages({
      "number.base": "روز تولد باید به صورت عدد وارد شود.",
      "number.integer": "روز تولد باید یک عدد صحیح باشد.",
      "number.min": "روز تولد نمی‌تواند کمتر از ۱ باشد.",
      "number.max": "روز تولد نمی‌تواند بیشتر از ۳۱ باشد.",
    }),

    initialBalance: joi
      .object({
        amount: joi
          .persianNumber()
          .integer()
          .min(0)
          .required()
          .messages({
            "number.base": "مبلغ مانده اولیه باید عدد باشد.",
            "number.integer": "مبلغ مانده اولیه باید عدد صحیح باشد.",
            "number.min": "مبلغ مانده اولیه نمی‌تواند منفی باشد.",
            "any.required": "ارسال مبلغ مانده اولیه الزامی است.",
          }),
        type: joi
          .string()
          .trim()
          .valid("DEBT", "CREDIT")
          .required()
          .messages({
            "string.base": "نوع مانده اولیه باید متن باشد.",
            "any.only":
              "نوع مانده اولیه فقط می‌تواند 'DEBT' (بدهی) یا 'CREDIT' (طلب) باشد.",
            "any.required": "ارسال نوع مانده اولیه الزامی است.",
          }),
      })
      .messages({
        "object.base": "اطلاعات مانده اولیه باید به صورت یک شیء ارسال شود.",
      }),
  })
    .min(1)
    .messages({
      "object.min": "حداقل یک فیلد برای ویرایش باید ارسال شود.",
    }),
};

const deleteCustomer = getCustomer;

const toggleCustomerStatus = getCustomer;

const settlementCustomer = {
  params: joi.object({ customerId: customerIdParamSchema }),

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
  addCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  toggleCustomerStatus,
  settlementCustomer,
};
