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

const getCashFlowCategoryById = async (categoryId) => {
  const cashFlowCategory =
    await cashFlowCategoryRepository.getCashFlowCategoryById(categoryId);

  if (!cashFlowCategory) {
    throw new AppError("دسته‌بندی یافت نشد", 404);
  }

  return cashFlowCategory;
};

const updateCashFlowCategoryById = async (categoryId, title) => {
  const cashFlowCategory =
    await cashFlowCategoryRepository.getCashFlowCategoryById(categoryId);

  if (!cashFlowCategory) {
    throw new AppError("دسته‌بندی یافت نشد", 404);
  }

  const isTaken = await cashFlowCategoryRepository.isTitleTaken(
    title,
    categoryId,
  );
  if (isTaken) {
    throw new AppError("دسته‌بندی با این عنوان از قبل ثبت شده است", 400);
  }

  const updatedCategory =
    await cashFlowCategoryRepository.updateCashFlowCategoryTitle(
      categoryId,
      title,
    );

  return updatedCategory;
};

export default {
  getCashFlowCategories,
  addCashFlowCategory,
  getCashFlowCategoryById,
  updateCashFlowCategoryById,
};
