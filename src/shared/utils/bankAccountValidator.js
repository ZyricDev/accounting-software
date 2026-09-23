import bankAccountRepository from "../../modules/bankAccount/bankAccount.repository.js";
import AppError from "../errors/AppError.js";

export const validateBankAccounts = async (accountIds) => {
  const uniqueIds = [...new Set(accountIds)];

  if (uniqueIds.length === 0) return;
  const accounts = await bankAccountRepository.getBankAccountsByIds(uniqueIds);

  for (const id of uniqueIds) {
    const foundAccount = accounts.find((acc) => acc.id === id);
    if (!foundAccount) {
      throw new AppError(`حساب بانکی (شناسه: ${id}) در سیستم پیدا نشد.`, 404);
    }
  }

  for (const account of accounts) {
    if (!account.is_active) {
      throw new AppError(
        `حساب بانکی «${account.title}» غیرفعال است و امکان ثبت تراکنش با آن وجود ندارد.`,
        400,
      );
    }
  }
};
