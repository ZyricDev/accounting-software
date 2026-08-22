import { sendSuccess } from "../../shared/utils/apiResponse.js";
import cartService from "./cart.service.js";

const createCart = async (req, res) => {
  const cartId = await cartService.createCart();

  return sendSuccess(res, "سبد خرید با موفقیت ایجاد شد", { id: cartId }, 201);
};

export default { createCart };

