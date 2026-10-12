import { Router } from "express";

import validate from "../../shared/middleware/validate.js";
import requireAuth from "../../shared/middleware/index.js";
import cashFlowController from "./cashFlow.controller.js";
import cashFlowValidation from "./cashFlow.validation.js";

const router = Router();

router.use(requireAuth);

router
  .route("/")
  .post(
    validate(cashFlowValidation.addCashFlow),
    cashFlowController.addCashFlow,
  )
  .get(
    validate(cashFlowValidation.getCashFlows),
    cashFlowController.getCashFlows,
  );

router
  .route("/:cashFlowId")
  .get(validate(cashFlowValidation.getCashFlow), cashFlowController.getCashFlow)
  .patch(
    validate(cashFlowValidation.updateCashFlow),
    cashFlowController.updateCashFlow,
  );

export default router;
