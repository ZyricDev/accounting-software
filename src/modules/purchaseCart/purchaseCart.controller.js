import purchaseCartService from "./purchaseCart.service.js";
import logger from "../../shared/utils/logger.js";
import { sendSuccess } from "../../shared/utils/apiResponse.js";

const createCart = async (req, res) => {
  const cart = await purchaseCartService.createCart();

  logger.info("Created purchase cart successfully", {
    id: cart.id,
  });

  return sendSuccess(res, "فاکتور خرید با موفقیت ایجاد شد", { cart }, 201);
};

export default { createCart };
