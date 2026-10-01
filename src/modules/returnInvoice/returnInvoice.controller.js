import { sendSuccess } from "../../shared/utils/apiResponse.js";
import returnInvoiceService from "./returnInvoice.service.js";

const getReturnInvoices = async (req, res) => {
  const result = await returnInvoiceService.getReturnInvoices(
    req.validatedQuery,
  );

  return sendSuccess(res, "فاکتورهای مرجوعی با موفقیت دریافت شد", result);
};

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

const getReturnInvoice = async (req, res) => {
  const { returnInvoiceId } = req.params;

  const invoice =
    await returnInvoiceService.getReturnInvoiceById(returnInvoiceId);

  return sendSuccess(res, "فاکتور مرجوعی با موفقیت دریافت شد", { invoice });
};

const cancelReturnInvoice = async (req, res) => {
  const { returnInvoiceId } = req.params;

  const invoice =
    await returnInvoiceService.cancelReturnInvoiceById(returnInvoiceId);

  return sendSuccess(res, "فاکتور مرجوعی با موفقیت باطل شد", { invoice });
};

export default {
  getReturnInvoices,
  createSaleReturn,
  createPurchaseReturn,
  getReturnInvoice,
  cancelReturnInvoice,
};
