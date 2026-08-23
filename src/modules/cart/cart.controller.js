import { sendSuccess } from "../../shared/utils/apiResponse.js";
import cartService from "./cart.service.js";

const createCart = async (req, res) => {
  const cart = await cartService.createCart();

  return sendSuccess(res, "سبد خرید با موفقیت ایجاد شد", { cart }, 201);
};

const addItem = async (req, res) => {
  const { cartId } = req.params;
  const itemData = req.body;

  const cart = await cartService.addItem(cartId, itemData);

  return sendSuccess(res, "محصول به سبد خرید اضافه شد", { cart });
};

export default { createCart, addItem };
