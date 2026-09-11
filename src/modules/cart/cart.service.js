import { randomUUID } from "crypto";
import AppError from "../../shared/errors/AppError.js";
import cartRepository from "./cart.repository.js";
import productRepository from "../product/product.repository.js";
import { buildCartSummary, toApiCart } from "../../shared/utils/cart.js";

const MAX_ACTIVE_CARTS = 5;

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

const salesItemTransformer = (item) => {
  const { purchasePrice, originalPrice, ...restOfItem } = item;
  return restOfItem;
};

const _saveAndFormatCart = async (cart) => {
  if (cart.items.length === 0) {
    cart.discountAmount = 0;
  } else {
    const { subtotal } = buildCartSummary(cart.items, "salePrice");
    if (cart.discountAmount > subtotal) {
      cart.discountAmount = 0;
    }
  }

  await cartRepository.updateCartState(
    cart.id,
    cart.items,
    cart.discountAmount,
  );

  return toApiCart(cart, "salePrice", salesItemTransformer);
};

const createCart = async () => {
  const cartCount = await cartRepository.countActiveCarts();

  if (cartCount >= MAX_ACTIVE_CARTS) {
    throw new AppError("تعداد سبدهای باز به حداکثر مجاز رسیده", 400);
  }

  const cart = await cartRepository.createCart();
  return toApiCart(cart, "salePrice", salesItemTransformer);
};

const getCarts = async () => {
  return await cartRepository.getCarts();
};

const searchProducts = async (searchTerm) => {
  const products = await cartRepository.searchProducts(searchTerm);
  return products.map(_toSearchResult);
};

const getCartByIdForView = async (cartId) => {
  const cart = await _getCartOrThrow(cartId);
  return toApiCart(cart, "salePrice", salesItemTransformer);
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

  return _saveAndFormatCart(cart);
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
  return _saveAndFormatCart(cart);
};

const updateSalePriceItemById = async ({ cartId, itemId, salePrice }) => {
  const cart = await _getCartOrThrow(cartId);
  const existingItem = cart.items.find((item) => item.id === itemId);

  if (!existingItem) throw new AppError("آیتم مورد نظر پیدا نشد", 404);

  existingItem.salePrice = salePrice;
  return _saveAndFormatCart(cart);
};

const applyDiscount = async (cartId, discountAmount) => {
  const cart = await _getCartOrThrow(cartId);
  const { subtotal } = buildCartSummary(cart.items, "salePrice");

  if (subtotal === 0) {
    throw new AppError("سبد خرید خالی است، امکان اعمال تخفیف نیست", 400);
  }

  if (discountAmount > subtotal) {
    throw new AppError("مبلغ تخفیف نمی‌تواند بیشتر از جمع کل سبد باشد", 400);
  }

  cart.discountAmount = discountAmount;
  return _saveAndFormatCart(cart);
};

const removeDiscount = async (cartId) => {
  const cart = await _getCartOrThrow(cartId);

  if (cart.items.length === 0) {
    throw new AppError("سبد خرید خالی است، امکان اعمال تخفیف نیست", 400);
  }

  cart.discountAmount = 0;
  return _saveAndFormatCart(cart);
};

const clearCartItems = async (cartId) => {
  const cart = await _getCartOrThrow(cartId);
  cart.items = [];
  return _saveAndFormatCart(cart);
};

const deleteItemById = async ({ cartId, itemId }) => {
  const cart = await _getCartOrThrow(cartId);
  const remainingItems = cart.items.filter((item) => item.id !== itemId);

  if (remainingItems.length === cart.items.length) {
    throw new AppError("آیتم مورد نظر پیدا نشد", 404);
  }

  cart.items = remainingItems;
  return _saveAndFormatCart(cart);
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
