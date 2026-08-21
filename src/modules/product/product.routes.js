import { Router } from "express";

import validate from "../../shared/middleware/validate.js";
import validateParams from "../../shared/middleware/validateParams.js";
import requireAuth from "../../shared/middleware/index.js";
import productController from "./product.controller.js";
import productValidation from "./product.validation.js";

const router = Router();

router.use(requireAuth);

router
  .route("/")
  .get(validate(productValidation.getProducts), productController.getProducts)
  .post(validate(productValidation.addProduct), productController.addProduct);

router
  .route("/:id")
  .get(validateParams("id"), productController.getProduct)
  .patch(
    validateParams("id"),
    validate(productValidation.updateProduct),
    productController.updateProduct,
  )
  .delete(validateParams("id"), productController.deleteProduct);

export default router;
