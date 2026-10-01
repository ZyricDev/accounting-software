import express from "express";

import validate from "../../shared/middleware/validate.js";
import requireAuth from "../../shared/middleware/index.js";
import returnInvoiceController from "./returnInvoice.controller.js";
import returnInvoiceValidation from "./returnInvoice.validation.js";

const router = express.Router();

router.get(
  "/",
  validate(returnInvoiceValidation.getReturnInvoices),
  returnInvoiceController.getReturnInvoices,
);

router
  .route("/:returnInvoiceId")
  .get(
    validate(returnInvoiceValidation.getReturnInvoice),
    returnInvoiceController.getReturnInvoice,
  );

router.post(
  "/sale",
  validate(returnInvoiceValidation.createReturnInvoice),
  returnInvoiceController.createSaleReturn,
);

router.post(
  "/purchase",
  requireAuth,
  validate(returnInvoiceValidation.createReturnInvoice),
  returnInvoiceController.createPurchaseReturn,
);

export default router;
