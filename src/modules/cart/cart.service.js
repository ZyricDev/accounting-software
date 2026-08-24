import { randomUUID } from "crypto";

const MAX_ACTIVE_CARTS = 5;

import AppError from "../../shared/errors/AppError.js";
import cartRepository from "./cart.repository.js";
import productRepository from "../product/product.repository.js";

const _buildCartSummary = (items, discountAmount = 0) => {
  let subtotal = 0;
  let totalQuantity = 0;

  const mappedItems = items?.map(({ purchasePrice, ...item }) => {
    const lineTotal = item.salePrice * item.quantity;
    subtotal += lineTotal;
    totalQuantity += item.quantity;

    return { ...item, lineTotal };
  });

  const total = Math.max(subtotal - discountAmount, 0);

  return {
    items: mappedItems || [],
    totalQuantity,
    subtotal,
    discountAmount,
    total,
  };
};

const _toApiCart = (cart) => {
  const summary = _buildCartSummary(cart.items, cart.discountAmount ?? 0);

  return {
    id: cart.id,
    ...summary,
  };
};

const createCart = async () => {
  const cartCount = await cartRepository.countActiveCarts();

  if (cartCount > MAX_ACTIVE_CARTS) {
    throw new AppError("تعداد سبدهای باز به حداکثر مجاز رسیده", 400);
  }

  const cart = await cartRepository.createCart();
  return _toApiCart(cart);
};

const getCartById = async (cartId) => {
  const cart = await cartRepository.getCartById(cartId);
  if (!cart) throw new AppError("سبد خرید پیدا نشد", 404);

  return _toApiCart(cart);
};

const addItem = async (cartId, { productId, quantity }) => {
  const cart = await cartRepository.getCartById(cartId);
  if (!cart) throw new AppError("سبد خرید پیدا نشد", 404);

  const product = await productRepository.getProductById(productId);
  if (!product) throw new AppError("محصول پیدا نشد", 404);

  if (product.stock === 0) {
    throw new AppError(`محصول «${product.name}» ناموجود است`, 400);
  }

  const existingItem = cart.items.find((item) => item.productId === product.id);
  const totalRequestedQuantity = (existingItem?.quantity ?? 0) + quantity;

  if (product.stock < totalRequestedQuantity) {
    throw new AppError(
      `تعداد درخواستی بیشتر از موجودی است.\n موجودی محصول «${product.name}» فقط ${product.stock} عدد می‌باشد.`,
      400,
    );
  }

  if (existingItem) {
    existingItem.quantity = totalRequestedQuantity;
  } else {
    cart.items.push({
      id: randomUUID(),
      productId: product.id,
      productName: product.name,
      salePrice: product.sale_price,
      purchasePrice: product.purchase_price,
      quantity,
    });
  }

  await cartRepository.saveCartItems(cartId, cart.items);

  return _toApiCart(cart);
};

const updateQuantityItemById = async ({ cartId, itemId, quantity }) => {
  const cart = await cartRepository.getCartById(cartId);
  if (!cart) throw new AppError("سبد خرید پیدا نشد", 404);

  const existingItem = cart.items.find((item) => item.id === itemId);
  if (!existingItem) throw new AppError("آیتم مورد نظر پیدا نشد", 404);

  const product = await productRepository.getProductById(
    existingItem.productId,
  );

  if (quantity > product.stock) {
    throw new AppError(
      `تعداد درخواستی بیشتر از موجودی است.\n موجودی محصول «${product.name}» فقط ${product.stock} عدد می‌باشد.`,
      400,
    );
  }

  existingItem.quantity = quantity;

  await cartRepository.saveCartItems(cartId, cart.items);

  return _toApiCart(cart);
};

const updateSalePriceItemById = async ({ cartId, itemId, salePrice }) => {
  const cart = await cartRepository.getCartById(cartId);
  if (!cart) throw new AppError("سبد خرید پیدا نشد", 404);

  const existingItem = cart.items.find((item) => item.id === itemId);
  if (!existingItem) throw new AppError("آیتم مورد نظر پیدا نشد", 404);

  existingItem.salePrice = salePrice;

  await cartRepository.saveCartItems(cartId, cart.items);

  return _toApiCart(cart);
};

const clearCartItems = async (cartId) => {
  const cart = await cartRepository.getCartById(cartId);
  if (!cart) throw new AppError("سبد خرید پیدا نشد", 404);

  cart.items = [];
  cart.discountAmount = 0;

  await cartRepository.saveCartItems(cartId, cart.items);

  return _toApiCart(cart);
};

const deleteItemById = async ({ cartId, itemId }) => {
  const cart = await cartRepository.getCartById(cartId);
  if (!cart) throw new AppError("سبد خرید پیدا نشد", 404);

  const remainingItems = cart.items.filter((item) => item.id !== itemId);

  if (remainingItems.length === cart.items.length) {
    throw new AppError("آیتم مورد نظر پیدا نشد", 404);
  }

  cart.items = remainingItems;

  await cartRepository.saveCartItems(cartId, cart.items);

  return _toApiCart(cart);
};

export default {
  createCart,
  getCartById,
  addItem,
  updateQuantityItemById,
  updateSalePriceItemById,
  clearCartItems,
  deleteItemById,
};
