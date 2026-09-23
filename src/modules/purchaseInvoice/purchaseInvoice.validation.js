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

const checkout = {
  body: createBodyObjectSchema({
    supplierId: joi.persianNumber().integer().positive().required().messages({
      "number.base": "شناسه تامین‌کننده باید عدد باشد.",
      "number.positive": "شناسه تامین‌کننده نامعتبر است.",
      "any.required": "انتخاب تامین‌کننده الزامی است.",
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

export default { checkout };
