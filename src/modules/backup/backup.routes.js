import { Router } from "express";

import backupController from "./backup.controller.js";

const router = Router();

router.post("/", backupController.createBackup);

export default router;