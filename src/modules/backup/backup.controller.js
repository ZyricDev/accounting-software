import backupService from "./backup.service.js";
import { sendSuccess } from "../../shared/utils/apiResponse.js";

const createBackup = async (req, res) => {
  const result = await backupService.createBackup();

  return sendSuccess(res, "بکاپ با موفقیت گرفته شد", result, 201);
};

export default { createBackup };