import joi from "../../shared/utils/customJoi.js";
import {
  createBodyObjectSchema,
  createQuerySchema,
} from "../../shared/utils/validationHelpers.js";

const returnInvoiceIdParamSchema = joi
  .number()
  .integer()
  .positive()
  .required()
  .messages({
    "number.base": "شناسه فاکتور مرجوعی باید عدد باشد.",
    "number.positive": "شناسه فاکتور مرجوعی نامعتبر است.",
    "any.required": "شناسه فاکتور مرجوعی الزامی است.",
  });

const getReturnInvoices = {
  query: createQuerySchema({
    returnType: joi
      .string()
      .valid("SALE_RETURN", "PURCHASE_RETURN")
      .required()
      .messages({
        "string.base": "نوع مرجوعی باید متن باشد.",
        "any.only":
          "نوع مرجوعی فقط می‌تواند 'SALE_RETURN' یا 'PURCHASE_RETURN' باشد.",
        "any.required": "ارسال نوع مرجوعی (returnType) الزامی است.",
      }),

    status: joi
      .string()
      .valid("ACTIVE", "CANCELLED")
      .empty("")
      .default(null)
      .messages({
        "any.only":
          "وضعیت فاکتور مرجوعی فقط می‌تواند ACTIVE یا CANCELLED باشد.",
      }),

    sortBy: joi
      .string()
      .valid("createdAt", "totalAmount")
      .default("createdAt")
      .messages({
        "string.base": "فیلد مرتب‌سازی باید یک رشته متنی باشد.",
        "any.only": "فیلد مرتب‌سازی نامعتبر است.",
      }),

    order: joi.string().valid("asc", "desc").default("desc").messages({
      "string.base": "جهت مرتب‌سازی باید یک رشته متنی باشد.",
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

    search: joi
      .string()
      .trim()
      .custom((value) => joi.persianToEnglishDigits(value))
      .max(100)
      .empty("")
      .default(null)
      .messages({
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
  }),
};

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

const getReturnInvoice = {
  params: joi.object({ returnInvoiceId: returnInvoiceIdParamSchema }),
};

const cancelReturnInvoice = getReturnInvoice;

export default {
  getReturnInvoices,
  createReturnInvoice,
  getReturnInvoice,
  cancelReturnInvoice,
};
