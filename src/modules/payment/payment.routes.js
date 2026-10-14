import { Router } from "express";

import validate from "../../shared/middleware/validate.js";
import requireAuth from "../../shared/middleware/index.js";
import paymentController from "./payment.controller.js";
import paymentValidation from "./payment.validation.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/settlements",
  validate(paymentValidation.getSettlements),
  paymentController.getSettlements,
);

export default router;
