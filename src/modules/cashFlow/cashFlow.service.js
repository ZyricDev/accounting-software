import AppError from "../../shared/errors/AppError.js";
import cashFlowCategoryRepository from "../cashFlowCategory/cashFlowCategory.repository.js";
import bankAccountRepository from "../bankAccount/bankAccount.repository.js";
import cashFlowRepository from "./cashFlow.repository.js";
import { generatePaginationData } from "../../shared/utils/apiResponse.js";

const _toApiFields = (dbRow) => {
  let result = {
    id: dbRow.id,
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

export default { addCashFlow, getCashFlows, getCashFlowById };
