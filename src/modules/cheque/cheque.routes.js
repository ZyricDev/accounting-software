import { Router } from "express";

import validate from "../../shared/middleware/validate.js";
import requireAuth from "../../shared/middleware/index.js";
import chequeController from "./cheque.controller.js";
import chequeValidation from "./cheque.validation.js";

const router = Router();

router.use(requireAuth);

router
  .route("/")
  .post(validate(chequeValidation.addCheque), chequeController.addCheque)
  .get(validate(chequeValidation.getCheques), chequeController.getCheques);

router
  .route("/:chequeId")
  .get(validate(chequeValidation.getCheque), chequeController.getCheque);

export default router;
