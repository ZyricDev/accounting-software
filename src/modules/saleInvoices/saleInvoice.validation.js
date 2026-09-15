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
  params: joi.object({
    cartId: joi.persianNumber().integer().positive().required().messages({
      "number.base": "شناسه سبد باید عدد باشد.",
      "number.positive": "شناسه سبد نامعتبر است.",
      "any.required": "شناسه سبد الزامی است.",
    }),
  }),

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

    customerName: joi
      .string()
      .trim()
      .max(120)
      .empty("")
      .default(null)
      .messages({
        "string.base": "نام مشتری باید متن باشد.",
        "string.max": "نام مشتری نمی‌تواند بیشتر از ۱۲۰ کاراکتر باشد.",
      }),

    customerPhone: joi
      .string()
      .trim()
      .empty("")
      .default(null)
      .custom((value) =>
        value === null ? value : joi.persianToEnglishDigits(value),
      )
      .pattern(/^09\d{9}$/)
      .when("creditAmount", {
        is: joi.persianNumber().greater(0),
        then: joi.required().messages({
          "any.required":
            "برای فروش نسیه، وارد کردن شماره تماس مشتری الزامی است.",
        }),
      })
      .messages({
        "string.base": "شماره تماس مشتری باید متن باشد.",
        "string.pattern.base": "فرمت شماره تماس نامعتبر است.",
      }),
  }),
};

export default { checkout };
