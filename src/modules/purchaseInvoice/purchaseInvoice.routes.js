import { Router } from "express";

import validate from "../../shared/middleware/validate.js";
import purchaseInvoiceController from "./purchaseInvoice.controller.js";
import purchaseInvoiceValidation from "./purchaseInvoice.validation.js";

const router = Router();

router.post(
  "/",
  validate(purchaseInvoiceValidation.addPurchaseInvoice),
  purchaseInvoiceController.addPurchaseInvoice,
);

export default router;
