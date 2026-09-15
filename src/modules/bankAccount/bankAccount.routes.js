import { Router } from "express";

import validate from "../../shared/middleware/validate.js";
import requireAuth from "../../shared/middleware/index.js";
import bankAccountController from "./bankAccount.controller.js";
import bankAccountValidation from "./bankAccount.validation.js";

const router = Router();

router.get("/active", bankAccountController.getActiveAccounts);

router.use(requireAuth);

router
  .route("/")
  .post(
    validate(bankAccountValidation.createAccount),
    bankAccountController.createAccount,
  )
  .get(bankAccountController.getAccounts);

router
  .route("/:accountId")
  .get(
    validate(bankAccountValidation.accountId),
    bankAccountController.getAccount,
  )
  .put(
    validate(bankAccountValidation.updateBankAccount),
    bankAccountController.updateBankAccount,
  )
  .delete(
    validate(bankAccountValidation.accountId),
    bankAccountController.deleteBankAccount,
  );

router.patch(
  "/:accountId/status",
  validate(bankAccountValidation.updateBankAccountStatus),
  bankAccountController.updateBankAccountStatus,
);

export default router;
