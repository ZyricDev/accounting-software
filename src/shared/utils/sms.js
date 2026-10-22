import crypto from "crypto";
import couponRepository from "../../modules/coupon/coupon.repository.js";
import config from "../../config/env.js";
import logger from "./logger.js";
import AppError from "../errors/AppError.js";

const faNum = (n) => Number(n).toLocaleString("fa-IR");

const formatToman = (amount) => `${faNum(Math.round(amount || 0))} تومان`;

const formatTomanWords = (amount) => {
  const n = Math.round(Math.abs(amount || 0));
  if (n === 0) return faNum(0);

  const parts = [];
  const billion = Math.floor(n / 1e9);
  const million = Math.floor((n % 1e9) / 1e6);
  const thousand = Math.floor((n % 1e6) / 1e3);
  const rest = n % 1e3;

  if (billion) parts.push(`${faNum(billion)} میلیارد`);
  if (million) parts.push(`${faNum(million)} میلیون`);
  if (thousand) parts.push(`${faNum(thousand)} هزار`);
  if (rest) parts.push(faNum(rest));

  return (amount < 0 ? "منفی " : "") + parts.join(" و ");
};

const ـgenerateUniqueCouponCode = async () => {
  let isUnique = false;
  let newCode = "";

  while (!isUnique) {
    newCode = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    const exists = await couponRepository.checkCouponExists(newCode);

    if (!exists) {
      isUnique = true;
    }
  }

  return newCode;
};

const sendPurchaseDiscountSMS = async ({
  invoiceId,
  customerId,
  customerName = "مشتری",
  customerPhone,
  totalAmount,
}) => {
  const rawDiscount = totalAmount * 0.05;
  const discountAmount = Math.floor(rawDiscount / 1000) * 1000;

  const rawMinPurchase = discountAmount * 5;
  const minPurchaseAmount = Math.ceil(rawMinPurchase / 10000) * 10000;

  const code = await ـgenerateUniqueCouponCode();

  const expireDays = Number(config.coupon.general.validityDays) || 25;
  const expireDateObj = new Date();
  expireDateObj.setDate(expireDateObj.getDate() + expireDays);
  expireDateObj.setHours(23, 59, 59, 999);

  const expireDateShamsi = new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(expireDateObj);

  await couponRepository.createCoupon({
    invoiceId,
    customerId,
    code,
    amount: discountAmount,
    minPurchase: minPurchaseAmount,
    expiresAt: expireDateObj,
  });

  const formattedDiscount = formatTomanWords(discountAmount);
  const formattedMinPurchase = formatTomanWords(minPurchaseAmount);

  const textParams = [
    customerName,
    formattedDiscount,
    formattedMinPurchase,
    code,
    expireDateShamsi,
  ].join(";");

  const payload = {
    username: config.melipayamak.username,
    password: config.melipayamak.password,
    text: textParams,
    to: customerPhone,
    bodyId: config.melipayamak.purchaseDiscountPatternId,
  };

  try {
    const response = await fetch(
      "https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();

    if (data.RetStatus !== 1) {
      logger.error(`Melipayamak API Error for ${customerPhone}:`, data);
    }
  } catch (error) {
    logger.error(
      `Network Error Sending SMS to ${customerPhone}:`,
      error.message,
    );
  }
};

const sendShiftReport = async ({ salesStats, returnsStats, netProfit }) => {
  const now = new Date().toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = new Date().toLocaleDateString("fa-IR");

  const reportText = `
🏪 *گالری مینل*
📊 *گزارش پایان شیفت*
📅 ${date}  |  ⏰ ${now}

🛒 *فروش امروز*

🧾 تعداد فاکتور: *${faNum(salesStats.total_invoices)}* عدد
💰 فروش کل: *${formatTomanWords(salesStats.final_payable_amount)}* تومان
🎁 تخفیف‌ها: ${formatTomanWords(salesStats.total_discount)} تومان
📝 نسیه (بستانکاری): ${formatTomanWords(salesStats.total_credit)} تومان


🔄 *مرجوعی / تعویضی*
📦 ${faNum(returnsStats.return_count)} فاکتور (${faNum(returnsStats.total_returned_items)} قلم کالا)


💎 *سود ناخالص امروز*
📈 *${formatTomanWords(netProfit > 0 ? netProfit : 0)}* تومان

`;

  const payload = {
    chat_id: config.bale.chatId,
    text: reportText,
  };

  try {
    const response = await fetch(
      `https://tapi.bale.ai/bot${config.bale.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();
    
    if (!data.ok) {
      logger.error(`Bale Bot API Error:`, data);
      throw new AppError(
        "اختلال در سرورهای پیام‌رسان بله. لطفاً دقایقی دیگر تلاش کنید.",
        502,
      );
    }

  } catch (error) {
    logger.error(`Network Error Sending Message to Bale:`, error.message);
    throw new AppError(
      "ارتباط با اینترنت قطع است! لطفاً اینترنت مغازه را بررسی کنید.",
      503,
    );
  }
};

export default { sendPurchaseDiscountSMS, sendShiftReport };
