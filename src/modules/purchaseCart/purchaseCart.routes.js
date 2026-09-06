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
  .post(validate(purchaseCartValidation.addItem), purchaseCartController.addItem);
//   .delete(validate(cartValidation.cartId), cartController.deleteItems);

export default router;
