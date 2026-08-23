import { Router } from "express";

import validate from "../../shared/middleware/validate.js";
import cartController from "./cart.controller.js";
import cartValidation from "./cart.validation.js";

const router = Router();

router.post("/", cartController.createCart);

router
  .route("/:cartId")
  .get(validate(cartValidation.getCart), cartController.getCart)
  .delete(validate(cartValidation.cartId), cartController.deleteCart);

router.post(
  "/:cartId/items",
  validate(cartValidation.addItem),
  cartController.addItem,
);

router.patch(
  "/:cartId/items/:itemId/quantity",
  validate(cartValidation.quantityItem),
  cartController.updateQuantityItem,
);

router.patch(
  "/:cartId/items/:itemId/price",
  validate(cartValidation.priceItem),
  cartController.updatePriceItem,
);

export default router;
