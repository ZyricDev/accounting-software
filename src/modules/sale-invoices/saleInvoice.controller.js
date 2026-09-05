import invoiceService from "./saleInvoice.service.js";
import logger from "../../shared/utils/logger.js";
import { sendSuccess } from "../../shared/utils/apiResponse.js";

const checkout = async (req, res) => {
  const { cartId } = req.params;
  const checkoutData = req.body;

  const invoice = await invoiceService.checkout(cartId, checkoutData);

  logger.info("invoice completed successfully", {
    invoiceId: invoice.id,
    cartId,
    totalAmount: invoice.totalAmount,
    paymentMethod: invoice.paymentMethod,
  });

  return sendSuccess(res, "فاکتور با موفقیت ثبت شد", { invoice }, 201);
};

export default { checkout };
