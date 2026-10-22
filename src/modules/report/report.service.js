import reportRepository from "./report.repository.js";
import sms from "../../shared/utils/sms.js";

const endShiftAndGenerateReport = async () => {
  const [salesStats, returnsStats] = await Promise.all([
    reportRepository.getTodaySalesStats(),
    reportRepository.getTodayReturnsStats(),
  ]);

  const actualSalesValue =
    Number(salesStats.gross_sales_items) - Number(salesStats.total_discount);
  const salesProfit = actualSalesValue - Number(salesStats.total_cogs);
  const returnsProfit =
    Number(returnsStats.total_returned_amount) -
    Number(returnsStats.total_return_cogs);

  const netProfit = salesProfit - returnsProfit;

  await sms.sendShiftReport({
    salesStats,
    returnsStats,
    netProfit,
  });

  return;
};

export default {
  endShiftAndGenerateReport,
};
