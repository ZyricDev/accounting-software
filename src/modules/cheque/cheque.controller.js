import { sendSuccess } from "../../shared/utils/apiResponse.js";
import chequeService from "./cheque.service.js";

const addCheque = async (req, res) => {
  const chequeData = req.body;

  const cheque = await chequeService.addCheque(chequeData);

  return sendSuccess(res, "چک با موفقیت ثبت شد", { cheque }, 201);
};

const getCheques = async (req, res) => {
  const result = await chequeService.getCheques(req.validatedQuery);

  return sendSuccess(res, "چک‌ها با موفقیت دریافت شد", result);
};

const getCheque = async (req, res) => {
  const { chequeId } = req.params;

  const cheque = await chequeService.getChequeById(chequeId);

  return sendSuccess(res, "چک‌ها با موفقیت دریافت شد", { cheque });
};

export default { addCheque, getCheques, getCheque };
