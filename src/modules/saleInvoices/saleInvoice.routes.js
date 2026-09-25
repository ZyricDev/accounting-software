import { Router } from "express";

import validate from "../../shared/middleware/validate.js";
import saleInvoiceController from "./saleInvoice.controller.js";
import saleInvoiceValidation from "./saleInvoice.validation.js";

const router = Router();

router
  .route("/")
  .post(
    validate(saleInvoiceValidation.addSaleInvoice),
    saleInvoiceController.addSaleInvoice,
  )
  .get(
    validate(saleInvoiceValidation.getSaleInvoices),
    saleInvoiceController.getSaleInvoices,
  );

export default router;
