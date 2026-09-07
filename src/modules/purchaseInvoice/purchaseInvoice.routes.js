import { Router } from "express";

import validate from "../../shared/middleware/validate.js";
import purchaseInvoiceController from "./purchaseInvoice.controller.js";
import purchaseInvoiceValidation from "./purchaseInvoice.validation.js";

const router = Router();

router.post(
  "/checkout",
  validate(purchaseInvoiceValidation.checkout),
  purchaseInvoiceController.checkout,
);

export default router;
