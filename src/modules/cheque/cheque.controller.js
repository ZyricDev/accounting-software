import { sendSuccess } from "../../shared/utils/apiResponse.js";
import chequeService from "./cheque.service.js";

const addCheque = async (req, res) => {
  const chequeData = req.body;

  const cheque = await chequeService.addCheque(chequeData);

  return sendSuccess(res, "چک با موفقیت ثبت شد", { cheque }, 201);
};

export default { addCheque };
