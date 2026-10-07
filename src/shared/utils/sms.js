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
    const randomNum = crypto.randomInt(0, 100000);
    newCode = String(randomNum).padStart(5, "0");

    const exists = await couponRepository.checkCouponExists(newCode);

    if (!exists) {
      isUnique = true;
    }
  }

  return newCode;
};

const sendPurchaseDiscountSMS = async (
  customerName = "مشتری",
  phoneNumber,
  paidAmount,
) => {
  const rawDiscount = paidAmount * 0.05;
  const discountAmount = Math.floor(rawDiscount / 1000) * 1000;

  const rawMinPurchase = discountAmount * 5;
  const minPurchaseAmount = Math.ceil(rawMinPurchase / 10000) * 10000;

  if (discountAmount < 5000) return;

  const code = await ـgenerateUniqueCouponCode();

  const expireDays = Number(config.sms.expireDays) || 25;
  const expireDateObj = new Date();
  expireDateObj.setDate(expireDateObj.getDate() + expireDays);
  expireDateObj.setHours(23, 59, 59, 999);

  const expireDateShamsi = new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(expireDateObj);

  await couponRepository.createCoupon({
    code,
    amount: discountAmount,
    minPurchase: minPurchaseAmount,
    expiresAt: expireDateObj,
  });

  const formattedDiscount = ـformatTomanReadable(discountAmount);
  const formattedMinPurchase = ـformatTomanReadable(minPurchaseAmount);

  const messageText = `${customerName} عزیز؛ هدیه ویژه مینل برای شما! 💎\n${formattedDiscount} تومان تخفیف اختصاصی\nحداقل خرید ${formattedMinPurchase} تومان\nکد تخفیف: ${code}\nتا ${expireDateShamsi}`;

  const params = new URLSearchParams({
    receptor: phoneNumber,
    message: messageText,
    sender: config.kavenegar.senderNumber,
  });

  try {
    const response = await fetch(
      `https://api.kavenegar.com/v1/${config.kavenegar.apikey}/sms/send.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      },
    );

    const data = await response.json();

    if (data.return && data.return.status !== 200) {
      logger.error(`Kavenegar API Error for ${phoneNumber}:`, data.return);
    }
  } catch (error) {
    logger.error(`Network Error Sending SMS to ${phoneNumber}:`, error.message);
  }
};

export default { sendPurchaseDiscountSMS };
