import { sendSuccess } from "../../shared/utils/apiResponse.js";
import logger from "../../shared/utils/logger.js";
import bankAccountService from "./bankAccount.service.js";

const createAccount = async (req, res) => {
  const bankAccount = await bankAccountService.createBankAccount(req.body);

  logger.info("Added bank account successfully", {
    title: bankAccount.title,
    cardNumber: bankAccount.cardNumber,
  });

  return sendSuccess(res, "حساب با موفقیت اضافه شد", { bankAccount }, 201);
};

const getActiveAccounts = async (req, res) => {
  const bankAccounts = await bankAccountService.getBankActiveAccounts();

  return sendSuccess(res, "حساب‌ها با موفقیت دریافت شد", { bankAccounts });
};

const getAccounts = async (req, res) => {
  const bankAccounts = await bankAccountService.getBankAccounts();

  return sendSuccess(res, "حساب‌ها با موفقیت دریافت شد", { bankAccounts });
};

const getAccount = async (req, res) => {
  const { accountId } = req.params;

  const bankAccount = await bankAccountService.getBankAccountById(accountId);

  return sendSuccess(res, "حساب با موفقیت دریافت شد", { bankAccount });
};

const updateBankAccount = async (req, res) => {
  const { accountId } = req.params;

  const bankAccount = await bankAccountService.updateBankAccountById(
    accountId,
    req.body,
  );

  logger.info("Updated bank account successfully", {
    title: bankAccount.title,
    cardNumber: bankAccount.cardNumber,
  });

  return sendSuccess(res, "حساب با موفقیت  اپدیت شد", { bankAccount });
};

const deleteBankAccount = async (req, res) => {
  const { accountId } = req.params;

  const bankAccount = await bankAccountService.deleteBankAccountById(accountId);

  logger.info("Deleted bank account successfully", {
    title: bankAccount.title,
    cardNumber: bankAccount.cardNumber,
  });

  return sendSuccess(res, "حساب با موفقیت  حذف شد", {
    bankAccount: { title: bankAccount.title },
  });
};

const updateBankAccountStatus = async (req, res) => {
  const { accountId } = req.params;

  const bankAccount =
    await bankAccountService.updateBankAccountStatusById(accountId);

  return sendSuccess(res, "وضعیت حساب با  موفقیت تغییر کرد", { bankAccount });
};

export default {
  createAccount,
  getActiveAccounts,
  getAccounts,
  getAccount,
  updateBankAccount,
  deleteBankAccount,
  updateBankAccountStatus,
};
