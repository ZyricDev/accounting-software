import { Router } from "express";

import validate from "../../shared/middleware/validate.js";
import requireAuth from "../../shared/middleware/index.js";
import authController from "./auth.controller.js";
import authValidation from "./auth.validation.js";

const router = Router();

router.post("/login", validate(authValidation.login), authController.login);

router.post(
  "/change-password",
  requireAuth,
  validate(authValidation.changePassword),
  authController.changePassword,
);

router.get('/check', requireAuth, authController.checkAuth);

router.delete("/logout", authController.logout);

export default router;
