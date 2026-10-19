import chequeRepository from "./cheque.repository.js";
import bankAccountRepository from "../bankAccount/bankAccount.repository.js";
import supplierRepository from "../supplier/supplier.repository.js";
import AppError from "../../shared/errors/AppError.js";

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

export default { addCheque };
