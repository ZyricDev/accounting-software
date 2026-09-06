import { randomUUID } from "crypto";

import purchaseCartRepository from "./purchaseCart.repository.js";
import productRepository from "../product/product.repository.js";
import AppError from "../../shared/errors/AppError.js";

const _buildCartSummary = (items) => {
  let subtotal = 0;
  let totalQuantity = 0;

  const mappedItems = items.map((item) => {
    const lineTotal = item.purchasePrice * item.quantity;
    subtotal += lineTotal;
    totalQuantity += item.quantity;

    return { ...item, lineTotal };
  });

  return {
    items: mappedItems,
    totalQuantity,
    subtotal,
  };
};

const _toApiCart = (cart) => {
  const summary = _buildCartSummary(cart.items);
  const discountAmount = cart.discountAmount ?? 0;

  return {
    id: cart.id,
    ...summary,
    discountAmount,
    finalTotal: summary.subtotal - discountAmount,
  };
};

const createCart = async () => {
  const activeCartsCount = await purchaseCartRepository.countActiveCarts();

  if (activeCartsCount >= 1) {
    throw new AppError(
      "یک فاکتور خرید باز و نیمه‌تمام وجود دارد؛ ابتدا آن را نهایی یا حذف کنید",
      409,
    );
  }

  const cart = await purchaseCartRepository.createCart();
  return _toApiCart(cart);
};

const getCart = async () => {
  const cart = await purchaseCartRepository.getActiveCart();

  if (!cart) {
    throw new AppError("در حال حاضر هیچ فاکتور خرید بازی وجود ندارد", 404);
  }

  return _toApiCart(cart);
};

const deleteCart = async () => {
  const cart = await purchaseCartRepository.getActiveCart();

  if (!cart) {
    throw new AppError("در حال حاضر هیچ فاکتور خرید بازی وجود ندارد", 404);
  }

  await purchaseCartRepository.deleteCartById(cart.id);
};

const addItem = async (productId) => {
  const cart = await purchaseCartRepository.getActiveCart();

  if (!cart) {
    throw new AppError("در حال حاضر هیچ فاکتور خرید بازی وجود ندارد", 404);
  }

  const product = await productRepository.getProductById(productId);
  if (!product) throw new AppError("محصول پیدا نشد", 404);

  const existingItem = cart.items.find((item) => item.productId === product.id);
  if (existingItem) {
    throw new AppError(
      `محصول «${product.name}» از قبل در این فاکتور خرید ثبت شده است.`,
      409,
    );
  }

  cart.items.push({
    id: randomUUID(),
    productId: product.id,
    productName: product.name,
    quantity: 1,
    purchasePrice: product.purchase_price ?? null,
    salePrice: product.sale_price ?? null,
  });

  await purchaseCartRepository.saveCartItems(cart.id, cart.items);

  return _toApiCart(cart);
};

export default { createCart, getCart, deleteCart, addItem };
