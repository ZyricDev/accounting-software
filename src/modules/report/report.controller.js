import { sendSuccess } from "../../shared/utils/apiResponse.js";
import reportService from "./report.service.js";

const endShiftAndGenerateReport = async (req, res) => {
  await reportService.endShiftAndGenerateReport();

  return sendSuccess(res, "شیفت با موفقیت بسته شد و گزارش ارسال گردید.");
};

export default { endShiftAndGenerateReport };
