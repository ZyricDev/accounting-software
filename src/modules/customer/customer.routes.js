import { Router } from "express";

import validate from "../../shared/middleware/validate.js";
import requireAuth from "../../shared/middleware/index.js";
import customerController from "./customer.controller.js";
import customerValidation from "./customer.validation.js";

const router = Router();

router.use(requireAuth);

router
  .route("/")
  .post(
    validate(customerValidation.addCustomer),
    customerController.addCustomer,
  )
  .get(
    validate(customerValidation.getCustomers),
    customerController.getCustomers,
  );

router
  .route("/:customerId")
  .get(validate(customerValidation.getCustomer), customerController.getCustomer)
  .patch(
    validate(customerValidation.updateCustomer),
    customerController.updateCustomer,
  )
  .delete(
    validate(customerValidation.deleteCustomer),
    customerController.deleteCustomer,
  );

router.patch(
  "/:customerId/status",
  validate(customerValidation.toggleCustomerStatus),
  customerController.toggleCustomerStatus,
);

router.post(
  "/:customerId/settlements",
  validate(customerValidation.settlementCustomer),
  customerController.settlementCustomer,
);

export default router;
