import saleInvoiceService from "./saleInvoice.service.js";
import logger from "../../shared/utils/logger.js";
import { sendSuccess } from "../../shared/utils/apiResponse.js";

const addSaleInvoice = async (req, res) => {
  const invoiceData = req.body;

  const invoice = await saleInvoiceService.addSaleInvoice(invoiceData);

  logger.info("invoice completed successfully", {
    invoiceId: invoice.id,
    cartId: invoice.cartId,
    totalAmount: invoice.totalAmount,
    paymentMethod: invoice.paymentMethod,
    creditAmount: invoice.creditAmount,
  });

  return sendSuccess(res, "فاکتور با موفقیت ثبت شد", { invoice }, 201);
};

const getSaleInvoices = async (req, res) => {
  const result = await saleInvoiceService.getSaleInvoices(req.validatedQuery);

  return sendSuccess(res, "فاکتورهای فروش با موفقیت دریافت شد", result);
};

const getSaleInvoice = async (req, res) => {
  const { saleInvoiceId } = req.params;

  const invoice = await saleInvoiceService.getSaleInvoiceById(saleInvoiceId);

  return sendSuccess(res, "فاکتور فروش با موفقیت دریافت شد", { invoice });
};

const updateSaleInvoice = async (req, res) => {
  const { saleInvoiceId } = req.params;
  const invoiceData = req.body;

  const invoice = await saleInvoiceService.updateSaleInvoiceById(
    saleInvoiceId,
    invoiceData,
  );

  return sendSuccess(res, "فاکتور فروش با موفقیت آپدیت شد", { invoice });
};

export default {
  addSaleInvoice,
  getSaleInvoices,
  getSaleInvoice,
  updateSaleInvoice,
};
