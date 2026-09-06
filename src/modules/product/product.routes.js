import { Router } from "express";

import validate from "../../shared/middleware/validate.js";
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
  .route("/:productId")
  .get(validate(productValidation.getProduct), productController.getProduct)
  .patch(
    validate(productValidation.updateProduct),
    productController.updateProduct,
  )
  .delete(
    validate(productValidation.deleteProduct),
    productController.deleteProduct,
  );

export default router;
