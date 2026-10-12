import { sendSuccess } from "../../shared/utils/apiResponse.js";
import cashFlowService from "../cashFlow/cashFlow.service.js";

const addCashFlow = async (req, res) => {
  const cashFlowData = req.body;

  const cashFlow = await cashFlowService.addCashFlow(cashFlowData);

  return sendSuccess(res, "هزینه/درآمد با موفقیت ثبت شد", { cashFlow }, 201);
};

const getCashFlows = async (req, res) => {
  const result = await cashFlowService.getCashFlows(req.validatedQuery);

  return sendSuccess(res, "هزینه‌ها/درآمد‌ها با موفقیت ثبت شد", result);
};

const getCashFlow = async (req, res) => {
  const { cashFlowId } = req.params;

  const cashFlow = await cashFlowService.getCashFlowById(cashFlowId);

  return sendSuccess(res, "هزینه‌/درآمد‌ با موفقیت ثبت شد", cashFlow);
};

const updateCashFlow = async (req, res) => {
  const { cashFlowId } = req.params;
  const updateData = req.body;

  const cashFlow = await cashFlowService.updateCashFlowById(
    cashFlowId,
    updateData,
  );

  return sendSuccess(res, "هزینه‌/درآمد‌ با موفقیت آپدیت شد", cashFlow);
};

export default { addCashFlow, getCashFlows, getCashFlow, updateCashFlow };
