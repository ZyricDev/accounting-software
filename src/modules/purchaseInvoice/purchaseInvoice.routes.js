import { Router } from "express";

import validate from "../../shared/middleware/validate.js";
import requireAuth from "../../shared/middleware/index.js";
import purchaseInvoiceController from "./purchaseInvoice.controller.js";
import purchaseInvoiceValidation from "./purchaseInvoice.validation.js";

const router = Router();

router.use(requireAuth);

router
  .route("/")
  .post(
    validate(purchaseInvoiceValidation.addPurchaseInvoice),
    purchaseInvoiceController.addPurchaseInvoice,
  )
  .get(
    validate(purchaseInvoiceValidation.getPurchaseInvoices),
    purchaseInvoiceController.getPurchaseInvoices,
  );

router
  .route("/:purchaseInvoiceId")
  .get(
    validate(purchaseInvoiceValidation.getPurchaseInvoice),
    purchaseInvoiceController.getPurchaseInvoice,
  )
  .patch(
    validate(purchaseInvoiceValidation.cancelPurchaseInvoice),
    purchaseInvoiceController.cancelPurchaseInvoice,
  )
  .put(
    validate(purchaseInvoiceValidation.updatePurchaseInvoice),
    purchaseInvoiceController.updatePurchaseInvoice,
  );

export default router;
