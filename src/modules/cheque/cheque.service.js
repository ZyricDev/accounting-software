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

export default { addCheque, getCheques };
