import { sendSuccess } from "../../shared/utils/apiResponse.js";
import purchaseInvoiceService from "./purchaseInvoice.service.js";

const addPurchaseInvoice = async (req, res) => {
  const invoice = await purchaseInvoiceService.addPurchaseInvoice(req.body);

  return sendSuccess(res, "فاکتور خرید با موفقیت نهایی شد", { invoice }, 201);
};

const getPurchaseInvoices = async (req, res) => {
  const result = await purchaseInvoiceService.getPurchaseInvoices(
    req.validatedQuery,
  );

  return sendSuccess(res, "فاکتورهای خرید با موفقیت دریافت شد", result);
};

const getPurchaseInvoice = async (req, res) => {
  const { purchaseInvoiceId } = req.params;

  const invoice =
    await purchaseInvoiceService.getPurchaseInvoiceById(purchaseInvoiceId);

  return sendSuccess(res, "فاکتور خرید با موفقیت دریافت شد", { invoice });
};

export default { addPurchaseInvoice, getPurchaseInvoices, getPurchaseInvoice };
