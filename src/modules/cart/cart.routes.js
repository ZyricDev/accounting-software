import { Router } from "express";

import validate from "../../shared/middleware/validate.js";
import cartController from "./cart.controller.js";
import cartValidation from "./cart.validation.js";

const router = Router();

router.route("/").post(cartController.createCart).get(cartController.getCarts);

router.get(
  "/products/search",
  validate(cartValidation.searchProducts),
  cartController.searchProducts,
);

router
  .route("/:cartId")
  .get(validate(cartValidation.getCart), cartController.getCart)
  .delete(validate(cartValidation.cartId), cartController.deleteCart);

router
  .route("/:cartId/items")
  .post(validate(cartValidation.addItem), cartController.addItem)
  .delete(validate(cartValidation.cartId), cartController.deleteItems);

router.delete(
  "/:cartId/items/:itemId",
  validate(cartValidation.deleteItem),
  cartController.deleteItem,
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
