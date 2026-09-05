import { Router } from "express";

import validate from "../../shared/middleware/validate.js";
import requireAuth from "../../shared/middleware/index.js";
import supplierController from "./supplier.controller.js";
import supplierValidation from "./supplier.validation.js";

const router = Router();

router.use(requireAuth);

router
  .route("/")
  .post(
    validate(supplierValidation.addSupplier),
    supplierController.addSupplier,
  )
  .get(
    validate(supplierValidation.getSuppliers),
    supplierController.getSuppliers,
  );

router
  .route("/:id")
  .get(validate(supplierValidation.getSupplier), supplierController.getSupplier)
  .patch(
    validate(supplierValidation.updateSupplier),
    supplierController.updateSupplier,
  );

export default router;
