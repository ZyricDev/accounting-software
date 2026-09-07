import { sendSuccess } from "../../shared/utils/apiResponse.js";
import purchaseInvoiceService from "./purchaseInvoice.service.js";

const checkout = async (req, res) => {
  const invoice = await purchaseInvoiceService.checkout(req.body);

  return sendSuccess(res, "فاکتور خرید با موفقیت نهایی شد", { invoice }, 201);
};

export default { checkout };