import { Router } from "express";

import reportController from "./report.controller.js";

const router = Router();

router.post("/end", reportController.endShiftAndGenerateReport );

export default router;