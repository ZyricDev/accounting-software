import { randomUUID } from "crypto";

import purchaseCartRepository from "./purchaseCart.repository.js";
import productRepository from "../product/product.repository.js";
import AppError from "../../shared/errors/AppError.js";
import { buildCartSummary, toApiCart } from "../../shared/utils/cart.js";

const _toPurchaseApiCart = (cart) => {
  const baseCart = toApiCart(cart, "purchasePrice");

  const totalSalePrice = baseCart.items.reduce((sum, item) => {
    const salePrice = item.salePrice || 0;
    return sum + salePrice * item.quantity;
  }, 0);

  const expectedTotalProfit =
    totalSalePrice - baseCart.subtotal + baseCart.discountAmount;

  return {
    ...baseCart,
    expectedTotalProfit,
  };
};

const _saveAndFormatCart = async (cart) => {
  if (cart.items.length === 0) {
    cart.discountAmount = 0;
  } else {
    const { subtotal } = buildCartSummary(cart.items, "purchasePrice");
    if (cart.discountAmount > subtotal) {
      cart.discountAmount = 0;
    }
  }

  await purchaseCartRepository.updateCartState(
    cart.id,
    cart.items,
    cart.discountAmount,
  );

  return _toPurchaseApiCart(cart);
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
  return _toPurchaseApiCart(cart);
};

const getCart = async () => {
  const cart = await purchaseCartRepository.getActiveCart();

  if (!cart) {
    throw new AppError("در حال حاضر هیچ فاکتور خرید بازی وجود ندارد", 404);
  }

  return _toPurchaseApiCart(cart);
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

  return _saveAndFormatCart(cart);
};

const deleteItems = async () => {
  const cart = await purchaseCartRepository.getActiveCart();

  if (!cart) {
    throw new AppError("در حال حاضر هیچ فاکتور خرید بازی وجود ندارد", 404);
  }

  cart.items = [];
  return _saveAndFormatCart(cart);
};

const deleteItem = async (itemId) => {
  const cart = await purchaseCartRepository.getActiveCart();

  if (!cart) {
    throw new AppError("در حال حاضر هیچ فاکتور خرید بازی وجود ندارد", 404);
  }

  const remainingItems = cart.items.filter((item) => item.id !== itemId);

  if (remainingItems.length === cart.items.length) {
    throw new AppError("آیتم مورد نظر پیدا نشد", 404);
  }

  cart.items = remainingItems;
  return _saveAndFormatCart(cart);
};

const updateQuantityItemById = async (itemId, quantity) => {
  const cart = await purchaseCartRepository.getActiveCart();

  if (!cart) {
    throw new AppError("در حال حاضر هیچ فاکتور خرید بازی وجود ندارد", 404);
  }

  const existingItem = cart.items.find((item) => item.id === itemId);
  if (!existingItem) throw new AppError("آیتم مورد نظر پیدا نشد", 404);

  existingItem.quantity = quantity;
  return _saveAndFormatCart(cart);
};

const updatePurchasePriceItemById = async (itemId, purchasePrice) => {
  const cart = await purchaseCartRepository.getActiveCart();

  if (!cart) {
    throw new AppError("در حال حاضر هیچ فاکتور خرید بازی وجود ندارد", 404);
  }

  const existingItem = cart.items.find((item) => item.id === itemId);
  if (!existingItem) throw new AppError("آیتم مورد نظر پیدا نشد", 404);

  existingItem.purchasePrice = purchasePrice;
  return _saveAndFormatCart(cart);
};

const updateSalePriceItemById = async (itemId, salePrice) => {
  const cart = await purchaseCartRepository.getActiveCart();

  if (!cart) {
    throw new AppError("در حال حاضر هیچ فاکتور خرید بازی وجود ندارد", 404);
  }

  const existingItem = cart.items.find((item) => item.id === itemId);
  if (!existingItem) throw new AppError("آیتم مورد نظر پیدا نشد", 404);

  existingItem.salePrice = salePrice;
  return _saveAndFormatCart(cart);
};

const applyDiscountToCart = async (discountAmount) => {
  const cart = await purchaseCartRepository.getActiveCart();

  if (!cart) {
    throw new AppError("در حال حاضر هیچ فاکتور خرید بازی وجود ندارد", 404);
  }

  if (discountAmount > buildCartSummary(cart.items, "purchasePrice").subtotal) {
    throw new AppError(
      "مبلغ تخفیف نمی‌تواند از مبلغ کل فاکتور بیشتر باشد",
      400,
    );
  }

  cart.discountAmount = discountAmount;
  return _saveAndFormatCart(cart);
};

const removeDiscountFromCart = async () => {
  const cart = await purchaseCartRepository.getActiveCart();

  if (!cart) {
    throw new AppError("در حال حاضر هیچ فاکتور خرید بازی وجود ندارد", 404);
  }

  cart.discountAmount = 0;
  return _saveAndFormatCart(cart);
};

export default {
  createCart,
  getCart,
  deleteCart,
  addItem,
  deleteItems,
  deleteItem,
  updateQuantityItemById,
  updatePurchasePriceItemById,
  updateSalePriceItemById,
  applyDiscountToCart,
  removeDiscountFromCart,
};
