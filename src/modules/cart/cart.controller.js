import { sendSuccess } from "../../shared/utils/apiResponse.js";
import cartService from "./cart.service.js";

const createCart = async (req, res) => {
  const cart = await cartService.createCart();

  return sendSuccess(res, "سبد خرید با موفقیت ایجاد شد", { cart }, 201);
};

const getCarts = async (req, res) => {
  const carts = await cartService.getCarts();

  return sendSuccess(res, "سبدها با موفقیت دریافت شد", { carts });
};

const getCart = async (req, res) => {
  const { cartId } = req.params;

  const cart = await cartService.getCartById(cartId);

  return sendSuccess(res, "سبد با موفقیت دریافت شد", { cart });
};

const deleteCart = async (req, res) => {
  const { cartId } = req.params;

  await cartService.deleteCart(cartId);

  return sendSuccess(res, "سبد با موفقیت حذف شد");
};

const addItem = async (req, res) => {
  const { cartId } = req.params;
  const itemData = req.body;

  const cart = await cartService.addItem(cartId, itemData);

  return sendSuccess(res, "محصول به سبد خرید اضافه شد", { cart });
};

const updateQuantityItem = async (req, res) => {
  const { cartId, itemId } = req.params;
  const { quantity } = req.body;

  const cart = await cartService.updateQuantityItemById({
    cartId,
    itemId,
    quantity,
  });

  return sendSuccess(res, "تعداد محصول با موفقیت آپدیت شد", { cart });
};

const updatePriceItem = async (req, res) => {
  const { cartId, itemId } = req.params;

  const { salePrice } = req.body;

  const cart = await cartService.updateSalePriceItemById({
    cartId,
    itemId,
    salePrice,
  });

  return sendSuccess(res, "قیمت محصول با موفقیت تغییر کرد", { cart });
};

const deleteItems = async (req, res) => {
  const { cartId } = req.params;

  const cart = await cartService.clearCartItems(cartId);

  return sendSuccess(res, "سبد با موفقیت خالی شد", { cart });
};

const deleteItem = async (req, res) => {
  const { cartId, itemId } = req.params;

  const cart = await cartService.deleteItemById({ cartId, itemId });

  return sendSuccess(res, " محصول با موفقیت حذف شد", { cart });
};

export default {
  createCart,
  getCarts,
  getCart,
  deleteCart,
  addItem,
  updateQuantityItem,
  updatePriceItem,
  deleteItems,
  deleteItem,
};
