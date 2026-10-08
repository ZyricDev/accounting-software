import { sendSuccess } from "../../shared/utils/apiResponse.js";
import cashFlowCategoryService from "./cashFlowCategory.service.js";

const getCashFlowCategories = async (req, res) => {
  const cashFlowCategories =
    await cashFlowCategoryService.getCashFlowCategories();

  return sendSuccess(res, "دسته‌بندی هزینه‌ها با موفقیت دریافت شد", {
    cashFlowCategories,
  });
};

export default { getCashFlowCategories };
