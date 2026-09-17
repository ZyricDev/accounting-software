import AppError from "../../shared/errors/AppError.js";
import bankAccountRepository from "./bankAccount.repository.js";

const _toApiFields = (dbRow) => ({
  id: dbRow.id,
  title: dbRow.title,
  ownerName: dbRow.owner_name || null,
  cardNumber: dbRow.card_number,
  accountNumber: dbRow.account_number || null,
  initialBalance: dbRow.initial_balance,
  isActive: Boolean(dbRow.is_active),
  createdAt: dbRow.created_at,
});

const createBankAccount = async (accountData) => {
  const { title, cardNumber, accountNumber, ownerName, initialBalance } =
    accountData;

  const existingTitle = await bankAccountRepository.isTitleTaken(title);
  if (existingTitle) {
    throw new AppError("این عنوان حساب قبلاً ثبت شده است.", 409);
  }

  if (cardNumber) {
    const existingCard =
      await bankAccountRepository.isCardNumberTaken(cardNumber);
    if (existingCard) {
      throw new AppError("این شماره کارت قبلاً در سیستم ثبت شده است.", 409);
    }
  }

  if (accountNumber) {
    const existingAccount =
      await bankAccountRepository.isAccountNumberTaken(accountNumber);
    if (existingAccount) {
      throw new AppError("این شماره حساب قبلاً در سیستم ثبت شده است.", 409);
    }
  }

  const now = new Date();
  const payload = {
    title,
    owner_name: ownerName || null,
    card_number: cardNumber,
    account_number: accountNumber || null,
    initial_balance: initialBalance || 0,
    is_active: 1,
  };

  const newBankAccount = await bankAccountRepository.addBankAccount(payload);

  return _toApiFields(newBankAccount);
};

const getBankActiveAccounts = async () => {
  const bankAccounts = await bankAccountRepository.getBankActiveAccounts();

  return bankAccounts.map((item) => ({
    id: item.id,
    title: item.title,
    cardNumber: item.card_number,
  }));
};

const getBankAccounts = async () => {
  const bankAccounts = await bankAccountRepository.getBankAccounts();

  return bankAccounts.map(_toApiFields);
};

const getBankAccountById = async (accountId) => {
  const bankAccount = await bankAccountRepository.getBankAccountById(accountId);
  if (!bankAccount) {
    throw new AppError("حساب پیدا نشد", 404);
  }

  return _toApiFields(bankAccount);
};

const updateBankAccountById = async (accountId, accountData) => {
  const { title, cardNumber, accountNumber, ownerName, initialBalance } =
    accountData;

  const bankAccount = await bankAccountRepository.getBankAccountById(accountId);
  if (!bankAccount) {
    throw new AppError("حساب بانکی مورد نظر پیدا نشد.", 404);
  }

  if (title && title !== bankAccount.title) {
    const existingTitle = await bankAccountRepository.isTitleTaken(title);
    if (existingTitle) {
      throw new AppError("این عنوان حساب قبلاً ثبت شده است.", 409);
    }
  }

  if (cardNumber && cardNumber !== bankAccount.card_number) {
    const existingCard =
      await bankAccountRepository.isCardNumberTaken(cardNumber);
    if (existingCard) {
      throw new AppError("این شماره کارت قبلاً در سیستم ثبت شده است.", 409);
    }
  }

  if (accountNumber && accountNumber !== bankAccount.account_number) {
    const existingAccount =
      await bankAccountRepository.isAccountNumberTaken(accountNumber);
    if (existingAccount) {
      throw new AppError("این شماره حساب قبلاً در سیستم ثبت شده است.", 409);
    }
  }

  const payload = {
    title,
    owner_name: ownerName || null,
    card_number: cardNumber,
    account_number: accountNumber || null,
    initial_balance: initialBalance || 0,
  };

  const updatedAccount = await bankAccountRepository.updateBankAccount(
    accountId,
    payload,
  );

  return _toApiFields(updatedAccount);
};

const deleteBankAccountById = async (accountId) => {
  const bankAccount = await bankAccountRepository.getBankAccountById(accountId);
  if (!bankAccount) {
    throw new AppError("حساب بانکی پیدا نشد.", 404);
  }

  const hasUsage = await bankAccountRepository.checkBankAccountUsage(accountId);
  if (hasUsage) {
    throw new AppError(
      "این حساب دارای تراکنش مالی است و قابل حذف نیست. لطفاً آن را غیرفعال کنید.",
      409,
    );
  }

  await bankAccountRepository.deleteBankAccountById(accountId);

  return { id: bankAccount.id, title: bankAccount.title };
};

const updateBankAccountStatusById = async (accountId) => {
  const bankAccount = await bankAccountRepository.getBankAccountById(accountId);
  if (!bankAccount) {
    throw new AppError("حساب بانکی پیدا نشد.", 404);
  }

  const newStatus = bankAccount.is_active ? 0 : 1;

  await bankAccountRepository.updateBankAccountStatusById(accountId, newStatus);

  return { id: bankAccount.id, isActive: Boolean(newStatus) };
};

export default {
  createBankAccount,
  getBankActiveAccounts,
  getBankAccounts,
  getBankAccountById,
  updateBankAccountById,
  deleteBankAccountById,
  updateBankAccountStatusById,
};
