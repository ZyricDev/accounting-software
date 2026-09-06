import BaseJoi from "joi";

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

const toEnglishDigits = (value) => {
  return value.replace(/[۰-۹٠-٩]/g, (char) => {
    const persianIndex = persianDigits.indexOf(char);
    if (persianIndex !== -1) return String(persianIndex);

    const arabicIndex = arabicDigits.indexOf(char);
    if (arabicIndex !== -1) return String(arabicIndex);

    return char;
  });
};

const PersianNumberExtension = (joi) => ({
  type: "persianNumber",
  base: joi.number(),
  coerce(value, helpers) {
    if (typeof value !== "string") {
      return { value };
    }

    return { value: toEnglishDigits(value) };
  },
});

const joi = BaseJoi.extend(PersianNumberExtension);

export default joi;
