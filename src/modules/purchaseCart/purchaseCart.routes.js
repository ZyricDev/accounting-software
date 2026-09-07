import { Router } from "express";

import validate from "../../shared/middleware/validate.js";
import requireAuth from "../../shared/middleware/index.js";
import purchaseCartController from "./purchaseCart.controller.js";
import purchaseCartValidation from "./purchaseCart.validation.js";

const router = Router();

router.use(requireAuth);

router
  .route("/")
  .post(purchaseCartController.createCart)
  .get(purchaseCartController.getCart)
  .delete(purchaseCartController.deleteCart);

router
  .route("/items")
  .post(
    validate(purchaseCartValidation.addItem),
    purchaseCartController.addItem,
  )
  .delete(purchaseCartController.deleteItems);

router.delete(
  "/items/:itemId",
  validate(purchaseCartValidation.deleteItem),
  purchaseCartController.deleteItem,
);

router.patch(
  "/items/:itemId/quantity",
  validate(purchaseCartValidation.quantityItem),
  purchaseCartController.updateQuantityItem,
);

router.patch(
  "/items/:itemId/purchase-price",
  validate(purchaseCartValidation.purchasePriceItem),
  purchaseCartController.updatePurchasePriceItem,
);

router.patch(
  "/items/:itemId/sale-price",
  validate(purchaseCartValidation.salePriceItem),
  purchaseCartController.updateSalePriceItem,
);

router
  .route("/discount")
  .post(
    validate(purchaseCartValidation.applyDiscount),
    purchaseCartController.applyDiscount,
  )
  .delete(purchaseCartController.removeDiscount);

export default router;
