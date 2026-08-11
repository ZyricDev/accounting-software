import joi from "joi";

const createBodyObjectSchema = (fields) => {
  return joi.object(fields).required().unknown(false).messages({
    "object.base": "بدنه‌ی درخواست باید یک آبجکت باشد",
    "any.required": "بدنه‌ی درخواست الزامی است",
  });
};

export { createBodyObjectSchema };