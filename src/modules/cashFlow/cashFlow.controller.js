import { sendSuccess } from "../../shared/utils/apiResponse.js";
import cashFlowService from "../cashFlow/cashFlow.service.js";

const addCashFlow = async (req, res) => {
  const cashFlowData = req.body;

  const cashFlow = await cashFlowService.addCashFlow(cashFlowData);

  return sendSuccess(res, "هزینه/درآمد با موفقیت ثبت شد", { cashFlow }, 201);
};

export default { addCashFlow };
