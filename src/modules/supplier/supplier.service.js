import AppError from "../../shared/errors/AppError.js";
import { generatePaginationData } from "../../shared/utils/apiResponse.js";
import { validateBankAccounts } from "../../shared/utils/bankAccountValidator.js";
import paymentRepository from "../payment/payment.repository.js";
import supplierRepository from "./supplier.repository.js";

const _toApiFields = (data) => ({
  id: data.id,
  name: data.name,
  phone: data.phone,
  address: data.address,
  currentBalance: data.current_balance,
  isBlocked: Boolean(data.is_blocked),
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const addSupplier = async ({ name, phone, address }) => {
  const phoneExist = await supplierRepository.isSupplierPhoneTaken(phone);
  if (phoneExist) {
    throw new AppError("تامین‌کننده با این شماره تلفن موجود است", 409);
  }

  const payload = {
    name,
    phone,
    address,
    current_balance: 0,
    is_blocked: false,
  };
  const supplier = await supplierRepository.createSupplier(payload);

  return _toApiFields(supplier);
};

const getSuppliers = async (filters) => {
  const { suppliers, total } = await supplierRepository.getSuppliers(filters);

  return {
    suppliers: suppliers.map(_toApiFields),
    pagination: generatePaginationData({
      page: filters.page,
      limit: filters.limit,
      total,
    }),
  };
};

const getSupplierById = async (supplierId) => {
  const supplier = await supplierRepository.getSupplierById(supplierId);
  if (!supplier) {
    throw new AppError("تامین کننده یافت نشد", 404);
  }

  return _toApiFields(supplier);
};

const updateSupplier = async (supplierId, supplierData) => {
  const supplier = await supplierRepository.getSupplierById(supplierId);
  if (!supplier) {
    throw new AppError("تامین کننده یافت نشد", 404);
  }

  if (supplierData.phone && supplierData.phone !== supplier.phone) {
    const phoneExist = await supplierRepository.isSupplierPhoneTaken(
      supplierData.phone,
    );
    if (phoneExist) {
      throw new AppError("تامین‌کننده با این شماره تلفن موجود است", 409);
    }
  }

  const updatedSupplier = await supplierRepository.updateSupplierById(
    supplierId,
    supplierData,
  );

  return _toApiFields(updatedSupplier);
};

const settlementSupplierById = async (
  supplierId,
  {
    type,
    cashAmount = 0,
    pos = { amount: 0, accountId: null },
    transfer = { amount: 0, accountId: null },
  },
) => {
  const supplierData = await supplierRepository.getSupplierById(supplierId);
  if (!supplierData) {
    throw new AppError("تامین کننده یافت نشد", 404);
  }

  const accountIdsToValidate = [];
  if (pos.amount > 0 && pos.accountId) accountIdsToValidate.push(pos.accountId);
  if (transfer.amount > 0 && transfer.accountId)
    accountIdsToValidate.push(transfer.accountId);

  await validateBankAccounts(accountIdsToValidate);

  const totalAmount = cashAmount + pos.amount + transfer.amount;

  const paymentsToCreate = [];
  if (cashAmount > 0) {
    paymentsToCreate.push({
      method: "CASH",
      amount: cashAmount,
      accountId: null,
    });
  }
  if (pos.amount > 0) {
    paymentsToCreate.push({
      method: "CARD",
      amount: pos.amount,
      accountId: pos.accountId,
    });
  }
  if (transfer.amount > 0) {
    paymentsToCreate.push({
      method: "TRANSFER",
      amount: transfer.amount,
      accountId: transfer.accountId,
    });
  }

  const balanceChange = type === "SETTLEMENT_OUT" ? -totalAmount : totalAmount;

  let connection;
  try {
    connection = await supplierRepository.getConnection();
    await connection.beginTransaction();

    await paymentRepository.createPayments(
      {
        invoiceType: type,
        invoiceId: null,
        personType: "SUPPLIER",
        personId: supplierId,
        payments: paymentsToCreate,
      },
      connection,
    );

    await supplierRepository.incrementDebt(
      supplierId,
      balanceChange,
      connection,
    );

    await connection.commit();

    return {
      supplierId,
      currentBalance: supplierData.current_balance + balanceChange,
      totalAmount,
      type,
    };
  } catch (err) {
    if (connection) await connection.rollback();
    throw err;
  } finally {
    if (connection) connection.release();
  }
};

export default {
  addSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  settlementSupplierById,
};
