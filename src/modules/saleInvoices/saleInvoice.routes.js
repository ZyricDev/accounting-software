import { Router } from "express";

import validate from "../../shared/middleware/validate.js";
import invoiceController from "./saleInvoice.controller.js";
import invoiceValidation from "./saleInvoice.validation.js";

const router = Router();

router.post(
  "/",
  validate(invoiceValidation.addSaleInvoice),
  invoiceController.addSaleInvoice,
);

export default router;
