import chequeRepository from "./cheque.repository.js";
import bankAccountRepository from "../bankAccount/bankAccount.repository.js";
import supplierRepository from "../supplier/supplier.repository.js";
import AppError from "../../shared/errors/AppError.js";
import { generatePaginationData } from "../../shared/utils/apiResponse.js";

const _toApiFields = (dbRow) => {
  return {
    id: dbRow.id,
    supplierId: dbRow.supplier_id,
    supplierName: dbRow.supplier_name,
    supplierPhone: dbRow.supplier_phone,
    accountTitle: dbRow.account_title,
    accountId: dbRow.account_id,
    serialNumber: dbRow.serial_number,
    sayyadId: dbRow.sayyad_id,
    status: dbRow.status,
    amount: dbRow.amount,
    dueDate: dbRow.due_date,
    description: dbRow?.description,
    createdAt: dbRow.created_at,
  };
};

const addCheque = async (chequeData) => {
  const { accountId } = chequeData;

  const supplier = await supplierRepository.getSupplierById(
    chequeData.supplierId,
  );
  if (!supplier) {
    throw new AppError("تامین‌کننده یافت نشد.", 404);
  }

  const bankAccount = await bankAccountRepository.getBankAccountById(accountId);
  if (!bankAccount || !bankAccount.is_active) {
    throw new AppError("حساب بانکی یافت نشد یا غیرفعال است.", 404);
  }

  const serialNumberExist = await chequeRepository.isSerialNumberTaken(
    accountId,
    chequeData.serialNumber,
  );
  if (serialNumberExist) {
    throw new AppError(
      "چکی با این شماره سریال برای این حساب بانکی قبلاً ثبت شده است.",
      409,
    );
  }

  if (chequeData.sayyadId) {
    const sayyadIdExist = await chequeRepository.isSayyadIdTaken(
      accountId,
      chequeData.sayyadId,
    );

    if (sayyadIdExist) {
      throw new AppError(
        "چکی با این شناسه صیادی قبلاً در سیستم ثبت شده است.",
        409,
      );
    }
  }

  const connection = await chequeRepository.getConnection();
  await connection.beginTransaction();

  try {
    const chequeId = await chequeRepository.createCheque(
      chequeData,
      connection,
    );

    await supplierRepository.incrementDebt(
      chequeData.supplierId,
      -chequeData.amount,
      connection,
    );

    await connection.commit();
    return { id: chequeId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getCheques = async (filters) => {
  const { cheques, total } = await chequeRepository.getAllCheques(filters);

  return {
    cheques: cheques.map(_toApiFields),
    pagination: generatePaginationData({
      page: filters.page,
      limit: filters.limit,
      total,
    }),
  };
};

const getChequeById = async (chequeId) => {
  const cheque = await chequeRepository.getChequeById(chequeId);

  if (!cheque) {
    throw new AppError("چک یافت نشد", 404);
  }

  return _toApiFields(cheque);
};

const updateChequeById = async (chequeId, updateData) => {
  const cheque = await chequeRepository.getChequeById(chequeId);
  if (!cheque) {
    throw new AppError("چک مورد نظر یافت نشد.", 404);
  }

  if (cheque.status !== "PENDING") {
    throw new AppError("فقط چک‌های در انتظار قابل ویرایش هستند.", 400);
  }

  const targetAccountId = updateData.accountId ?? cheque.accountId;
  const targetSerialNumber = updateData.serialNumber ?? cheque.serialNumber;
  const targetSayyadId =
    updateData.sayyadId !== undefined ? updateData.sayyadId : cheque.sayyadId;

  if (updateData.accountId && updateData.accountId !== cheque.accountId) {
    const bankAccount =
      await bankAccountRepository.getBankAccountById(targetAccountId);

    if (!bankAccount || !bankAccount.isActive) {
      throw new AppError("حساب بانکی پیدا نشد یا غیرفعال است.", 404);
    }
  }

  const serialTaken = await chequeRepository.isSerialNumberTaken(
    targetAccountId,
    targetSerialNumber,
    chequeId,
  );
  if (serialTaken) {
    throw new AppError(
      "چکی با این شماره سریال در این حساب بانکی موجود است.",
      409,
    );
  }

  if (targetSayyadId) {
    const sayyadTaken = await chequeRepository.isSayyadIdTaken(
      targetAccountId,
      targetSayyadId,
      chequeId,
    );
    if (sayyadTaken) {
      throw new AppError("چکی با این شناسه صیادی قبلاً ثبت شده است.", 409);
    }
  }

  await chequeRepository.updateChequeById(chequeId, updateData);

  return { id: chequeId };
};

const cancelChequeById = async (chequeId, description = null) => {
  const cheque = await chequeRepository.getChequeById(chequeId);
  if (!cheque) {
    throw new AppError("چک مورد نظر یافت نشد.", 404);
  }

  if (cheque.status === "CANCELLED") {
    throw new AppError("این چک قبلاً باطل شده است.", 400);
  }

  const connection = await chequeRepository.getConnection();
  await connection.beginTransaction();
  try {
    await chequeRepository.markAsCancelled(chequeId, description, connection);

    await supplierRepository.incrementDebt(
      cheque.supplierId,
      cheque.amount,
      connection,
    );

    await connection.commit();

    return { id: chequeId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export default {
  addCheque,
  getCheques,
  getChequeById,
  updateChequeById,
  cancelChequeById,
};
