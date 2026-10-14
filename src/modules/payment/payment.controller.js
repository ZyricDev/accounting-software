import { sendSuccess } from "../../shared/utils/apiResponse.js";
import paymentService from "./payment.service.js";

const getSettlements = async (req, res) => {
  const result = await paymentService.getSettlements(req.validatedQuery);

  return sendSuccess(res, "تراکنش‌ها با موفقیت دریافت شد", result);
};

export default { getSettlements };
