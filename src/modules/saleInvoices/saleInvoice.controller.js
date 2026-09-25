import saleInvoiceService from "./saleInvoice.service.js";
import logger from "../../shared/utils/logger.js";
import { sendSuccess } from "../../shared/utils/apiResponse.js";

const addSaleInvoice = async (req, res) => {
  const checkoutData = req.body;

  const saleInvoice = await saleInvoiceService.addSaleInvoice(checkoutData);

  logger.info("saleInvoice completed successfully", {
    invoiceId: saleInvoice.id,
    cartId:saleInvoice.cartId,
    totalAmount: saleInvoice.totalAmount,
    paymentMethod: saleInvoice.paymentMethod,
    creditAmount: saleInvoice.creditAmount,
  });

  return sendSuccess(res, "فاکتور با موفقیت ثبت شد", { saleInvoice }, 201);
};

const getSaleInvoices = async (req, res) => {
  const result = await saleInvoiceService.getSaleInvoices(req.validatedQuery);

  return sendSuccess(res, "فاکتورهای فروش با موفقیت دریافت شد", result);
};

export default { addSaleInvoice, getSaleInvoices };
