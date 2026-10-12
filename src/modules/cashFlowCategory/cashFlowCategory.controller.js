import { sendSuccess } from "../../shared/utils/apiResponse.js";
import cashFlowCategoryService from "./cashFlowCategory.service.js";

const getCashFlowCategories = async (req, res) => {
  const result = await cashFlowCategoryService.getCashFlowCategories(
    req.validatedQuery,
  );

  return sendSuccess(res, "دسته‌بندی هزینه‌ها با موفقیت دریافت شد", result);
};

const addCashFlowCategory = async (req, res) => {
  const { title, type } = req.body;

  const cashFlowCategory = await cashFlowCategoryService.addCashFlowCategory({
    title,
    type,
  });

  return sendSuccess(
    res,
    "دسته‌بندی‌ با موفقیت اضافه شد",
    {
      cashFlowCategory,
    },
    201,
  );
};

const getCashFlowCategory = async (req, res) => {
  const { categoryId } = req.params;

  const cashFlowCategory =
    await cashFlowCategoryService.getCashFlowCategoryById(categoryId);

  return sendSuccess(res, "دسته‌بندی‌ با موفقیت دریافت شد", {
    cashFlowCategory,
  });
};

const updateCashFlowCategory = async (req, res) => {
  const { categoryId } = req.params;
  const { title } = req.body;

  const cashFlowCategory =
    await cashFlowCategoryService.updateCashFlowCategoryById(categoryId, title);

  return sendSuccess(res, "دسته‌بندی‌ با موفقیت آپدیت شد", {
    cashFlowCategory,
  });
};

const deleteCashFlowCategory = async (req, res) => {
  const { categoryId } = req.params;

  await cashFlowCategoryService.deleteCashFlowCategoryById(categoryId);

  return sendSuccess(res, "دسته‌بندی‌ با موفقیت حذف شد");
};

export default {
  getCashFlowCategories,
  addCashFlowCategory,
  getCashFlowCategory,
  updateCashFlowCategory,
  deleteCashFlowCategory,
};
