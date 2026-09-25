import invoiceService from "./saleInvoice.service.js";
import logger from "../../shared/utils/logger.js";
import { sendSuccess } from "../../shared/utils/apiResponse.js";

const addSaleInvoice = async (req, res) => {
  const checkoutData = req.body;

  const invoice = await invoiceService.addSaleInvoice(checkoutData);

  logger.info("invoice completed successfully", {
    invoiceId: invoice.id,
    cartId,
    totalAmount: invoice.totalAmount,
    paymentMethod: invoice.paymentMethod,
    creditAmount: invoice.creditAmount,
  });

  return sendSuccess(res, "فاکتور با موفقیت ثبت شد", { invoice }, 201);
};

export default { addSaleInvoice };
