import { sendSuccess } from "../../shared/utils/apiResponse.js";
import purchaseInvoiceService from "./purchaseInvoice.service.js";

const addPurchaseInvoice = async (req, res) => {
  const invoice = await purchaseInvoiceService.addPurchaseInvoice(req.body);

  return sendSuccess(res, "فاکتور خرید با موفقیت نهایی شد", { invoice }, 201);
};

export default { addPurchaseInvoice };
