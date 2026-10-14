import AppError from "../../shared/errors/AppError.js";
import { generatePaginationData } from "../../shared/utils/apiResponse.js";
import paymentRepository from "./payment.repository.js";
import customerRepository from "../customer/customer.repository.js";
import supplierRepository from "../supplier/supplier.repository.js";

const _toApiFields = (dbRow) => {
  let result = {
    id: dbRow.id,
    referenceType: dbRow.reference_type,
    method: dbRow.method,
    amount: dbRow.amount,
    status: dbRow.status,
    description: dbRow.description,
    personId: dbRow.person_id,
    personName: dbRow.person_name,
    personPhone: dbRow.person_phone,
    paymentDate: dbRow.payment_date,
    createdAt: dbRow.created_at,
  };

  if (dbRow.method !== "CASH") {
    result.accountId = dbRow.account_id;
    result.accountTitle = dbRow.account_title;
  }
  return result;
};

const getSettlements = async (filters) => {
  const { settlements, total } =
    await paymentRepository.getSettlements(filters);

  return {
    settlements: settlements.map(_toApiFields),
    pagination: generatePaginationData({
      page: filters.page,
      limit: filters.limit,
      total,
    }),
  };
};

const getSettlementById = async (settlementId) => {
  const settlement = await paymentRepository.getSettlementById(settlementId);

  if (!settlement) {
    throw new AppError("تراکنش یافت نشد", 404);
  }

  return _toApiFields(settlement);
};

const updateSettlementById = async (settlementId, updateData) => {
  const existingSettlement =
    await paymentRepository.getSettlementById(settlementId);
  if (!existingSettlement) {
    throw new AppError("تراکنش یافت نشد", 404);
  }

  if (existingSettlement.status === "CANCELLED") {
    throw new AppError(
      "این تراکنش باطل شده است و امکان ویرایش آن وجود ندارد.",
      400,
    );
  }

  const finalData = {
    paymentDate: updateData.paymentDate || existingSettlement.payment_date,
    description:
      updateData.description !== null
        ? updateData.description
        : existingSettlement.description,
  };

  await paymentRepository.updateSettlementById(settlementId, finalData);

  return { id: settlementId };
};

const cancelSettlementById = async (settlementId) => {
  const existingSettlement =
    await paymentRepository.getSettlementById(settlementId);
  if (!existingSettlement) {
    throw new AppError("تراکنش یافت نشد", 404);
  }

  if (existingSettlement.status === "CANCELLED") {
    throw new AppError("این تراکنش قبلا باطل شده است.", 400);
  }

  let connection;
  try {
    connection = await paymentRepository.getConnection();
    await connection.beginTransaction();

    await paymentRepository.cancelSettlementById(settlementId, connection);

    const { person_type, reference_type, person_id, amount } =
      existingSettlement;

    if (person_type === "CUSTOMER") {
      const balanceChange =
        reference_type === "SETTLEMENT_IN" ? amount : -amount;
      await customerRepository.incrementDebt(
        person_id,
        balanceChange,
        connection,
      );
    } else if (person_type === "SUPPLIER") {
      const balanceChange =
        reference_type === "SETTLEMENT_OUT" ? amount : -amount;
      await supplierRepository.incrementDebt(
        person_id,
        balanceChange,
        connection,
      );
    }

    await connection.commit();

    return { id: settlementId };
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export default {
  getSettlements,
  getSettlementById,
  updateSettlementById,
  cancelSettlementById,
};
