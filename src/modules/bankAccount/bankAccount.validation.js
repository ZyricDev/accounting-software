import joi from "../../shared/utils/customJoi.js";

import { createBodyObjectSchema } from "../../shared/utils/validationHelpers.js";

const createAccount = {
  body: createBodyObjectSchema({
    title: joi.string().trim().max(100).required().messages({
      "string.base": "عنوان حساب باید یک متن باشد.",
      "string.max": "عنوان حساب نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد.",
      "any.required": "وارد کردن عنوان حساب (مثل کارت‌خوان ملت) الزامی است.",
    }),

    ownerName: joi.string().trim().max(120).empty("").default(null).messages({
      "string.base": "نام مالک باید متن باشد.",
      "string.max": "نام مالک نمی‌تواند بیشتر از ۱۲۰ کاراکتر باشد.",
    }),

    cardNumber: joi
      .string()
      .trim()
      .empty("")
      .default(null)
      .custom((value) =>
        value === null ? value : joi.persianToEnglishDigits(value),
      )
      .pattern(/^\d{16}$/)
      .required()
      .messages({
        "string.base": "شماره کارت باید متن یا عدد باشد.",
        "string.pattern.base": "شماره کارت باید دقیقاً ۱۶ رقم باشد.",
        "any.required": "وارد کردن شماره کارت الزامی است",
      }),

    accountNumber: joi
      .string()
      .trim()
      .empty("")
      .default(null)
      .custom((value) =>
        value === null ? value : joi.persianToEnglishDigits(value),
      )
      .messages({
        "string.base": "شماره حساب باید متن یا عدد باشد.",
      }),

    initialBalance: joi
      .persianNumber()
      .integer()
      .min(0)
      .empty("")
      .default(0)
      .messages({
        "number.base": "موجودی اولیه باید یک عدد باشد.",
        "number.min": "موجودی اولیه حساب نمی‌تواند منفی باشد.",
      }),
  }),
};

const accountId = {
  params: joi.object({
    accountId: joi.persianNumber().integer().positive().required().messages({
      "number.base": "شناسه حساب باید عدد باشد.",
      "number.positive": "شناسه حساب نامعتبر است.",
      "any.required": "شناسه حساب الزامی است.",
    }),
  }),
};

const updateBankAccount = createAccount;

const updateBankAccountStatus = accountId;

export default {
  createAccount,
  accountId,
  updateBankAccount,
  updateBankAccountStatus,
};
