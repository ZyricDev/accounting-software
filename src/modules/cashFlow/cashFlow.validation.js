import joi from "../../shared/utils/customJoi.js";
import { createBodyObjectSchema } from "../../shared/utils/validationHelpers.js";

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

const addCashFlow = {
  body: createBodyObjectSchema({
    categoryId: buildIdSchema("دسته‌بندی").required(),

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

    transfer: buildPaymentMethodSchema("کارت به کارت"),

    description: joi.string().trim().max(1000).empty("").messages({
      "string.base": "توضیحات باید متن باشد.",
      "string.max": "توضیحات نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد.",
    }),

    paymentDate: joi
      .date()
      .iso()
      .empty(joi.valid("", null))
      .default(() => new Date())
      .messages({
        "date.base": "تاریخ پرداخت نامعتبر است.",
        "date.format":
          "تاریخ پرداخت باید یک تاریخ معتبر با فرمت استاندارد باشد.",
      }),
  })
    .custom((value, helpers) => {
      const hasCash = value.cashAmount > 0;
      const hasTransfer = value.transfer.amount > 0;

      if (!hasCash && !hasTransfer) {
        return helpers.error("object.noAmount");
      }

      if (hasCash && hasTransfer) {
        return helpers.error("object.multipleMethods");
      }

      return value;
    })
    .messages({
      "object.noAmount":
        "مبلغ تراکنش را به‌صورت نقدی یا کارت به کارت وارد کنید.",
      "object.multipleMethods":
        "در هر تراکنش فقط یک روش پرداخت (نقدی یا کارت به کارت) مجاز است.",
    }),
};

export default { addCashFlow };
