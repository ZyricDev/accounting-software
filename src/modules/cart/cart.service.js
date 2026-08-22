const MAX_ACTIVE_CARTS = 5;

import AppError from "../../shared/errors/AppError.js";
import cartRepository from "./cart.repository.js";

const createCart = async () => {
  const cartCount = await cartRepository.countActiveCarts();

  if (cartCount > MAX_ACTIVE_CARTS) {
    throw new AppError("تعداد سبدهای باز به حداکثر مجاز رسیده", 400);
  }

  return cartRepository.createCart();
};

export default { createCart };
