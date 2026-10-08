import { Router } from "express";

import validate from "../../shared/middleware/validate.js";
import requireAuth from "../../shared/middleware/index.js";
import cashFlowCategoryController from "./cashFlowCategory.controller.js";
import cashFlowCategoryValidation from "./cashFlowCategory.validation.js";

const router = Router();

router.use(requireAuth);

router
  .route("/")
  .get(cashFlowCategoryController.getCashFlowCategories)
  .post(
    validate(cashFlowCategoryValidation.addCashFlowCategory),
    cashFlowCategoryController.addCashFlowCategory,
  );

export default router;
