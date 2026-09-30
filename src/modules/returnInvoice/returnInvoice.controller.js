import { sendSuccess } from "../../shared/utils/apiResponse.js";
import returnInvoiceService from "./returnInvoice.service.js";

const createSaleReturn = async (req, res) => {
  const { referenceInvoiceId, items } = req.body;

  const returnInvoice = await returnInvoiceService.createReturnInvoice({
    returnType: "SALE_RETURN",
    referenceInvoiceId,
    items,
  });

  return sendSuccess(res, "مرجوعی با موفقیت ثبت شد", { returnInvoice });
};

const createPurchaseReturn = async (req, res) => {
  const { referenceInvoiceId, items } = req.body;

  const returnInvoice = await returnInvoiceService.createReturnInvoice({
    returnType: "PURCHASE_RETURN",
    referenceInvoiceId,
    items,
  });

  return sendSuccess(res, "مرجوعی با موفقیت ثبت شد", { returnInvoice });
};

export default { createSaleReturn, createPurchaseReturn };
