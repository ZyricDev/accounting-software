import { Router } from "express";

import validate from "../../shared/middleware/validate.js";
import authController from "./auth.controller.js";
import authValidation from "./auth.validation.js";

const router = Router();

router.post("/login", validate(authValidation.login), authController.login);

router.delete("/logout", authController.logout);

export default router;
