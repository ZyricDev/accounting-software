import { sendSuccess } from "../../shared/utils/apiResponse.js";
import cashFlowService from "../cashFlow/cashFlow.service.js";

const addCashFlow = async (req, res) => {
  const cashFlowData = req.body;

  const cashFlow = await cashFlowService.addCashFlow(cashFlowData);

  return sendSuccess(res, "هزینه/درآمد با موفقیت ثبت شد", { cashFlow }, 201);
};

const getCashFlows = async (req, res) => {
  const result = await cashFlowService.getCashFlows(req.validatedQuery);

  return sendSuccess(res, "هزینه‌ها/درآمد‌ها با موفقیت ثبت شد", result, 201);
};

export default { addCashFlow, getCashFlows };
