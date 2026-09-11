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

    const englishString = toEnglishDigits(value);
    const parsedNumber = Number(englishString);

    if (!isNaN(parsedNumber)) {
      return { value: parsedNumber };
    }

    return { value };
  },
});

const joi = BaseJoi.extend(PersianNumberExtension);
joi.persianToEnglishDigits = toEnglishDigits;

export default joi;
