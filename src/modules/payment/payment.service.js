import { generatePaginationData } from "../../shared/utils/apiResponse.js";
import paymentRepository from "./payment.repository.js";

const _toApiFields = (dbRow) => {
  let result = {
    id: dbRow.id,
    referenceType: dbRow.reference_type,
    method: dbRow.method,
    amount: dbRow.amount,
    status: dbRow.status,
    description: dbRow?.description,
    personId: dbRow.person_id,
    personName: dbRow.person_name,
    personPhone: dbRow.person_phone,
    paymentDate: dbRow.payment_date,
    createdAt: dbRow?.created_at,
  };

  if (dbRow.payment_method !== "CASH") {
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

export default { getSettlements };
