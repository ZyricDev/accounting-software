import { Router } from "express";

import validate from "../../shared/middleware/validate.js";
import invoiceController from "./invoice.controller.js";
import invoiceValidation from "./invoice.validation.js";

const router = Router();

router.post(
  "/:cartId/checkout",
  validate(invoiceValidation.checkout),
  invoiceController.checkout,
);

export default router;
