import { Router } from "express";

import validate from "../../shared/middleware/validate.js";
import validateParams from "../../shared/middleware/validateParams.js";
import cartController from "./cart.controller.js";
import cartValidation from "./cart.validation.js";

const router = Router();

router.post("/", cartController.createCart)

export default router;
