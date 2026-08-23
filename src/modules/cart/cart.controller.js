import { sendSuccess } from "../../shared/utils/apiResponse.js";
import cartService from "./cart.service.js";

const createCart = async (req, res) => {
  const cart = await cartService.createCart();

  return sendSuccess(res, "سبد خرید با موفقیت ایجاد شد", { cart }, 201);
};

const getCart = async (req, res) => {
  const { cartId } = req.params;

  const cart = await cartService.getCartById(cartId);

  return sendSuccess(res, "سبد با موفقیت دریافت شد", { cart });
};

const deleteCart = async (req, res) => {
  const { cartId } = req.params;

  const cart = await cartService.deleteCartById(cartId);

  return sendSuccess(res, "سبد با موفقیت حذف شد", { cart });
};

const addItem = async (req, res) => {
  const { cartId } = req.params;
  const itemData = req.body;

  const cart = await cartService.addItem(cartId, itemData);

  return sendSuccess(res, "محصول به سبد خرید اضافه شد", { cart });
};

const updateQuantityItem = async (req, res) => {
  const { cartId } = req.params;
  const { itemId } = req.params;
  const { quantity } = req.body;

  const cart = await cartService.updateQuantityItemById({
    cartId,
    itemId,
    quantity,
  });

  return sendSuccess(res, "تعداد محصول با موفقیت آپدیت شد", { cart });
};

const updatePriceItem = async (req, res) => {
  const { cartId } = req.params;
  const { itemId } = req.params;
  const { salePrice } = req.body;

  const cart = await cartService.updateSalePriceItemById({
    cartId,
    itemId,
    salePrice,
  });

  return sendSuccess(res, "قیمت محصول با موفقیت تغییر کرد", { cart });
};

export default {
  createCart,
  getCart,
  deleteCart,
  addItem,
  updateQuantityItem,
  updatePriceItem,
};
