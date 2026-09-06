import purchaseCartRepository from "./purchaseCart.repository.js";
import AppError from "../../shared/errors/AppError.js";

const _buildCartSummary = (items) => {
  let subtotal = 0;
  let totalQuantity = 0;

  const mappedItems = items.map(({ purchasePrice, ...item }) => {
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

export default { createCart };
