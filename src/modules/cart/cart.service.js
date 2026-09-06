import { randomUUID } from "crypto";

const MAX_ACTIVE_CARTS = 5;

import AppError from "../../shared/errors/AppError.js";
import cartRepository from "./cart.repository.js";
import productRepository from "../product/product.repository.js";

// --- Internal helpers ---

const _buildCartSummary = (items) => {
  let subtotal = 0;
  let totalQuantity = 0;

  const mappedItems = items.map(({ purchasePrice, ...item }) => {
    const lineTotal = item.salePrice * item.quantity;
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

const _toSearchResult = (dbRow) => ({
  id: dbRow.id,
  name: dbRow.name,
  stock: dbRow.stock,
  salePrice: dbRow.sale_price,
});

const _getCartOrThrow = async (cartId) => {
  const cart = await cartRepository.getCartById(cartId);
  if (!cart) throw new AppError("سبد خرید پیدا نشد", 404);

  return cart;
};

// --- Service functions ---

const createCart = async () => {
  const cartCount = await cartRepository.countActiveCarts();

  if (cartCount >= MAX_ACTIVE_CARTS) {
    throw new AppError("تعداد سبدهای باز به حداکثر مجاز رسیده", 400);
  }

  const cart = await cartRepository.createCart();
  return _toApiCart(cart);
};

const getCarts = async () => {
  const carts = await cartRepository.getCarts();
  return carts;
};

const searchProducts = async (searchTerm) => {
  const products = await cartRepository.searchProducts(searchTerm);
  return products.map(_toSearchResult);
};

const getCartByIdForView = async (cartId) => {
  const cart = await _getCartOrThrow(cartId);
  return _toApiCart(cart);
};

const deleteCart = async (cartId) => {
  await _getCartOrThrow(cartId);
  await cartRepository.deleteCartById(cartId);
};

const addItem = async (cartId, { productId, quantity }) => {
  const cart = await _getCartOrThrow(cartId);

  const product = await productRepository.getProductById(productId);
  if (!product) throw new AppError("محصول پیدا نشد", 404);

  if (product.stock === 0) {
    throw new AppError(`محصول «${product.name}» ناموجود است`, 400);
  }

  const existingItem = cart.items.find((item) => item.productId === product.id);
  const totalRequestedQuantity = (existingItem?.quantity ?? 0) + quantity;

  if (product.stock < totalRequestedQuantity) {
    throw new AppError(
      `تعداد درخواستی بیشتر از موجودی است.\nموجودی محصول «${product.name}» فقط ${product.stock} عدد می‌باشد.`,
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
      originalPrice: product.sale_price,
      salePrice: product.sale_price,
      purchasePrice: product.purchase_price,
      quantity,
    });
  }

  await cartRepository.saveCartItems(cartId, cart.items);

  return _toApiCart(cart);
};

const updateQuantityItemById = async ({ cartId, itemId, quantity }) => {
  const cart = await _getCartOrThrow(cartId);

  const existingItem = cart.items.find((item) => item.id === itemId);
  if (!existingItem) throw new AppError("آیتم مورد نظر پیدا نشد", 404);

  const product = await productRepository.getProductById(
    existingItem.productId,
  );
  if (!product) throw new AppError("محصول پیدا نشد", 404);

  if (quantity > product.stock) {
    throw new AppError(
      `تعداد درخواستی بیشتر از موجودی است.\nموجودی محصول «${product.name}» فقط ${product.stock} عدد می‌باشد.`,
      400,
    );
  }

  existingItem.quantity = quantity;

  await cartRepository.saveCartItems(cartId, cart.items);

  return _toApiCart(cart);
};

const updateSalePriceItemById = async ({ cartId, itemId, salePrice }) => {
  const cart = await _getCartOrThrow(cartId);

  const existingItem = cart.items.find((item) => item.id === itemId);
  if (!existingItem) throw new AppError("آیتم مورد نظر پیدا نشد", 404);

  existingItem.salePrice = salePrice;

  await cartRepository.saveCartItems(cartId, cart.items);

  return _toApiCart(cart);
};

const applyDiscount = async (cartId, discountAmount) => {
  const cart = await _getCartOrThrow(cartId);
  const { subtotal } = _buildCartSummary(cart.items);

  if (subtotal === 0) {
    throw new AppError("سبد خرید خالی است، امکان اعمال تخفیف نیست", 400);
  }

  if (discountAmount > subtotal) {
    throw new AppError("مبلغ تخفیف نمی‌تواند بیشتر از جمع کل سبد باشد", 400);
  }

  const newCart = await cartRepository.saveCartDiscount(cartId, discountAmount);

  return _toApiCart(newCart);
};

const removeDiscount = async (cartId) => {
  const cart = await _getCartOrThrow(cartId);

  if (cart.items.length === 0) {
    throw new AppError("سبد خرید خالی است، امکان اعمال تخفیف نیست", 400);
  }
  const newCart = await cartRepository.saveCartDiscount(cartId, 0);

  return _toApiCart(newCart);
};

const clearCartItems = async (cartId) => {
  const cart = await _getCartOrThrow(cartId);

  cart.items = [];

  await cartRepository.saveCartItems(cartId, cart.items);

  return _toApiCart(cart);
};

const deleteItemById = async ({ cartId, itemId }) => {
  const cart = await _getCartOrThrow(cartId);

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
  getCarts,
  searchProducts,
  getCartByIdForView,
  deleteCart,
  addItem,
  updateQuantityItemById,
  updateSalePriceItemById,
  applyDiscount,
  removeDiscount,
  clearCartItems,
  deleteItemById,
};
