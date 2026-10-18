import crypto from "crypto";
import couponRepository from "../../modules/coupon/coupon.repository.js";
import config from "../../config/env.js";
import logger from "./logger.js";

const ـformatTomanReadable = (amount) => {
  if (amount >= 1000000) {
    const formatted = (amount / 1000000)
      .toLocaleString("fa-IR")
      .replace("٫", ".");
    return `${formatted} میلیون`;
  }

  if (amount >= 1000) {
    const formatted = (amount / 1000).toLocaleString("fa-IR").replace("٫", ".");
    return `${formatted} هزار`;
  }

  return amount.toLocaleString("fa-IR");
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

  const formattedDiscount = ـformatTomanReadable(discountAmount);
  const formattedMinPurchase = ـformatTomanReadable(minPurchaseAmount);

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

export default { sendPurchaseDiscountSMS };
