import joi from "../../shared/utils/customJoi.js";
import {
  createBodyObjectSchema,
  createQuerySchema,
} from "../../shared/utils/validationHelpers.js";

const ALLOWED_INVOICE_SORT_FIELDS = ["createdAt", "totalAmount"];

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

const saleInvoiceIdParamSchema = joi
  .number()
  .integer()
  .positive()
  .required()
  .messages({
    "number.base": "شناسه فاکتور فروش باید عدد باشد.",
    "number.positive": "شناسه فاکتور فروش نامعتبر است.",
    "any.required": "شناسه فاکتور فروش الزامی است.",
  });

const addSaleInvoice = {
  body: createBodyObjectSchema({
    cartId: joi.persianNumber().integer().positive().required().messages({
      "number.base": "شناسه سبد باید عدد باشد.",
      "number.positive": "شناسه سبد نامعتبر است.",
      "any.required": "شناسه سبد الزامی است.",
    }),

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

    creditAmount: joi
      .persianNumber()
      .integer()
      .min(0)
      .empty("")
      .default(0)
      .messages({
        "number.base": "مبلغ نسیه باید عدد باشد.",
        "number.min": "مبلغ نسیه نمی‌تواند منفی باشد.",
      }),

    customerId: joi
      .persianNumber()
      .integer()
      .positive()
      .empty("")
      .default(null)
      .when("creditAmount", {
        is: joi.persianNumber().greater(0),
        then: joi.required().messages({
          "any.required": "برای فروش نسیه، انتخاب مشتری الزامی است.",
        }),
      })
      .messages({
        "number.base": "شناسه مشتری باید عدد باشد.",
        "number.integer": "شناسه مشتری نامعتبر است.",
        "number.positive": "شناسه مشتری نامعتبر است.",
      }),
  })
    .custom((value, helpers) => {
      const totalPaid =
        value.cashAmount +
        value.pos.amount +
        value.transfer.amount +
        value.creditAmount;

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

const getSaleInvoices = {
  query: createQuerySchema({
    sortBy: joi
      .string()
      .valid(...ALLOWED_INVOICE_SORT_FIELDS)
      .default("createdAt")
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

    paymentMethod: joi
      .string()
      .valid("CASH", "CARD", "TRANSFER", "CREDIT", "MIXED")
      .empty("")
      .default(null)
      .messages({
        "string.base": "روش پرداخت باید یک رشته متنی باشد.",
        "any.only": "روش پرداخت ارسال شده معتبر نیست.",
      }),
  }),
};

const getSaleInvoice = {
  params: joi.object({ saleInvoiceId: saleInvoiceIdParamSchema }),
};

export default { addSaleInvoice, getSaleInvoices, getSaleInvoice };
