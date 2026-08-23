import { Router } from "express";

import validate from "../../shared/middleware/validate.js";
import cartController from "./cart.controller.js";
import cartValidation from "./cart.validation.js";

const router = Router();

router.post("/", cartController.createCart);

router.get(
  "/:cartId",
  validate(cartValidation.getCart),
  cartController.getCart,
);

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

export default router;
