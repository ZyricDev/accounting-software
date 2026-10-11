import AppError from "../../shared/errors/AppError.js";
import cashFlowCategoryRepository from "../cashFlowCategory/cashFlowCategory.repository.js";
import bankAccountRepository from "../bankAccount/bankAccount.repository.js";
import cashFlowRepository from "./cashFlow.repository.js";

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
    method: isCash ? "CASH" : "TRANSFER",
    amount: isCash ? cashAmount : transfer.amount,
    paymentDate,
    description,
  };

  const id = await cashFlowRepository.createCashFlow(flowToCreate);

  return { id };
};

export default { addCashFlow };
