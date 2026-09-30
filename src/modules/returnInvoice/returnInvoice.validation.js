import joi from "../../shared/utils/customJoi.js";
import { createBodyObjectSchema } from "../../shared/utils/validationHelpers.js";

const createReturnInvoice = {
  body: createBodyObjectSchema({
    referenceInvoiceId: joi
      .persianNumber()
      .integer()
      .positive()
      .required()
      .messages({
        "number.base": "شناسه فاکتور مرجع باید عدد باشد.",
        "number.integer": "شناسه فاکتور مرجع نامعتبر است.",
        "number.positive": "شناسه فاکتور مرجع نامعتبر است.",
        "any.required": "انتخاب فاکتور مرجع الزامی است.",
      }),

    items: joi
      .array()
      .items(
        joi.object({
          productId: joi
            .persianNumber()
            .integer()
            .positive()
            .required()
            .messages({
              "number.base": "شناسه محصول باید عدد باشد.",
              "number.integer": "شناسه محصول نامعتبر است.",
              "number.positive": "شناسه محصول نامعتبر است.",
              "any.required": "شناسه محصول الزامی است.",
            }),

          quantity: joi.number().integer().positive().required().messages({
            "number.base": "تعداد باید عدد باشد.",
            "number.integer": "تعداد نباید اعشاری باشد.",
            "number.positive": "تعداد باید بیشتر از صفر باشد.",
            "any.required": "تعداد الزامی است.",
          }),
        }),
      )
      .min(1)
      .required()
      .messages({
        "array.base": "آیتم‌های مرجوعی باید یک آرایه باشد.",
        "array.min": "حداقل یک کالا باید برای مرجوعی انتخاب شود.",
        "any.required": "آیتم‌های مرجوعی الزامی است.",
      }),
  }),
};

export default {
  createReturnInvoice,
};
