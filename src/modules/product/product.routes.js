import { Router } from "express";

import validate from "../../shared/middleware/validate.js";
import requireAuth from "../../shared/middleware/index.js";
import productController from "./product.controller.js";
import productValidation from "./product.validation.js";

const router = Router();

router.use(requireAuth);

router.post(
  "/",
  validate(productValidation.addProduct),
  productController.addProduct,
);

export default router;
