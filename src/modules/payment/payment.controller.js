import { sendSuccess } from "../../shared/utils/apiResponse.js";
import paymentService from "./payment.service.js";

const getSettlements = async (req, res) => {
  const result = await paymentService.getSettlements(req.validatedQuery);

  return sendSuccess(res, "تراکنش‌ها با موفقیت دریافت شد", result);
};

const getSettlement = async (req, res) => {
  const { settlementId } = req.params;
  const settlement = await paymentService.getSettlementById(settlementId);

  return sendSuccess(res, "تراکنش‌ با موفقیت دریافت شد", settlement);
};

export default { getSettlements, getSettlement };
