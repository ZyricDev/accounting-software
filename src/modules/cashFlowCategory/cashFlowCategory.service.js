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

const deleteCashFlowCategoryById = async (categoryId) => {
  try {
    const isDeleted =
      await cashFlowCategoryRepository.deleteCategoryById(categoryId);

    if (!isDeleted) {
      throw new AppError("دسته‌بندی یافت نشد", 404);
    }
  } catch (err) {
    if (err.code === "ER_ROW_IS_REFERENCED_2" || err.errno === 1451) {
      throw new AppError(
        "این دسته‌بندی دارای تراکنش مالی است و قابل حذف نیست.",
        400,
      );
    }

    throw err;
  }
};

export default {
  getCashFlowCategories,
  addCashFlowCategory,
  getCashFlowCategoryById,
  updateCashFlowCategoryById,
  deleteCashFlowCategoryById,
};
