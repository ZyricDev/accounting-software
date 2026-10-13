import AppError from "../../shared/errors/AppError.js";
import cashFlowCategoryRepository from "../cashFlowCategory/cashFlowCategory.repository.js";
import bankAccountRepository from "../bankAccount/bankAccount.repository.js";
import cashFlowRepository from "./cashFlow.repository.js";
import { generatePaginationData } from "../../shared/utils/apiResponse.js";

const _toApiFields = (dbRow) => {
  let result = {
    id: dbRow.id,
    status: dbRow.status,
    amount: dbRow.amount,
    paymentMethod: dbRow.payment_method,
    categoryId: dbRow.category_id,
    categoryTitle: dbRow.category_title,
    flowType: dbRow.flow_type,
    paymentDate: dbRow?.payment_date,
    description: dbRow?.description,
    createdAt: dbRow.created_at,
  };

  if (dbRow.payment_method === "TRANSFER") {
    result.accountId = dbRow.account_id;
    result.accountTitle = dbRow.account_title;
  }
  return result;
};

const addCashFlow = async ({
  categoryId,
  cashAmount = 0,
  transfer = { amount: 0, accountId: null },
  paymentDate = new Date(),
  description = null,
}) => {
  const isCash = cashAmount > 0 ? true : false;
  const category =
    await cashFlowCategoryRepository.getCashFlowCategoryById(categoryId);
  if (!category) {
    throw new AppError("دسته‌بندی یافت نشد", 404);
  }

  const flowType = category.type;

  if (!isCash) {
    const account = await bankAccountRepository.getBankAccountById(
      transfer.accountId,
    );
    if (!account) throw new AppError("حساب‌ بانکی یافت نشد", 404);
  }

  const flowToCreate = {
    accountId: isCash ? null : transfer.accountId,
    categoryId,
    flowType,
    paymentMethod: isCash ? "CASH" : "TRANSFER",
    amount: isCash ? cashAmount : transfer.amount,
    paymentDate,
    description,
  };

  const id = await cashFlowRepository.createCashFlow(flowToCreate);

  return { id };
};

const getCashFlows = async (filters) => {
  const { cashFlows, total } = await cashFlowRepository.getCashFlows(filters);

  return {
    cashFlows: cashFlows.map(_toApiFields),
    pagination: generatePaginationData({
      page: filters.page,
      limit: filters.limit,
      total,
    }),
  };
};

const getCashFlowById = async (cashFlowId) => {
  const cashFlow = await cashFlowRepository.getCashFlowById(cashFlowId);

  if (!cashFlow) {
    throw new AppError("هزینه/درآمد یافت نشد", 404);
  }

  return _toApiFields(cashFlow);
};

const updateCashFlowById = async (cashFlowId, updateData) => {
  const existingFlow = await cashFlowRepository.getCashFlowById(cashFlowId);
  if (!existingFlow) {
    throw new AppError("هزینه/درآمد یافت نشد", 404);
  }

  if (existingFlow.status === "CANCELLED") {
    throw new AppError(
      "این هزینه/درآمد باطل شده است و امکان ویرایش آن وجود ندارد.",
      400,
    );
  }

  if (updateData.categoryId) {
    const categoryExists =
      await cashFlowCategoryRepository.getCashFlowCategoryById(
        updateData.categoryId,
      );
    if (!categoryExists) {
      throw new AppError("دسته‌بندی یافت نشد", 404);
    }
  }

  const finalData = {
    categoryId: updateData.categoryId || existingFlow.category_id,
    paymentDate: updateData.paymentDate || existingFlow.payment_date,
    description:
      updateData.description !== undefined
        ? updateData.description
        : existingFlow.description,
  };

  await cashFlowRepository.updateCashFlow(cashFlowId, finalData);

  return { id: cashFlowId };
};

const cancelCashFlowById = async (cashFlowId) => {
  const existingFlow = await cashFlowRepository.getCashFlowById(cashFlowId);
  if (!existingFlow) {
    throw new AppError("هزینه/درآمد یافت نشد", 404);
  }

  if (existingFlow.status === "CANCELLED") {
    throw new AppError("این هزینه/درآمد قبلا باطل شده است.", 400);
  }

  await cashFlowRepository.cancelCashFlowById(cashFlowId);

  return { cashFlowId };
};

export default {
  addCashFlow,
  getCashFlows,
  getCashFlowById,
  updateCashFlowById,
  cancelCashFlowById,
};
