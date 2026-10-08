import AppError from "../../shared/errors/AppError.js";
import cashFlowCategoryRepository from "./cashFlowCategory.repository.js";

const getCashFlowCategories = async () => {
  const cashFlowCategories =
    await cashFlowCategoryRepository.getCashFlowCategories();

  return cashFlowCategories;
};

const addCashFlowCategory = async ({ title, type }) => {
  const existingTitle = await cashFlowCategoryRepository.isTitleTaken(title);

  if (existingTitle) {
    throw new AppError("دسته‌بندی با این عنوان از قبل ثبت شده است", 409);
  }

  const cashFlowCategory =
    await cashFlowCategoryRepository.createCashFlowCategory({ title, type });

  return cashFlowCategory;
};

export default { getCashFlowCategories, addCashFlowCategory };
