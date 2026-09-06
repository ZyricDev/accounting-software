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

const getCart = async (req, res) => {
  const cart = await purchaseCartService.getCart();

  return sendSuccess(res, "فاکتور خرید با موفقیت دریافت شد", { cart });
};

const deleteCart = async (req, res) => {
  await purchaseCartService.deleteCart();

  return sendSuccess(res, "فاکتور خرید با موفقیت حذف شد");
};

const addItem = async (req, res) => {
  const cart = await purchaseCartService.addItem(req.body.productId);

  return sendSuccess(res, "محصول به فاکتور خرید اضافه شد", { cart });
};

const deleteItems = async (req, res) => {
  const cart = await purchaseCartService.deleteItems();

  return sendSuccess(res, "محصولات فاکتور خرید با موفقیت حذف شد", { cart });
};

export default { createCart, getCart, deleteCart, addItem, deleteItems };
