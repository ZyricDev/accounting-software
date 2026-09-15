import AppError from "../../shared/errors/AppError.js";
import purchaseCartRepository from "../purchaseCart/purchaseCart.repository.js";
import supplierRepository from "../supplier/supplier.repository.js";
import productRepository from "../product/product.repository.js";
import purchaseInvoiceRepository from "./purchaseInvoice.repository.js";
import paymentRepository from "../payment/payment.repository.js";
import bankAccountRepository from "../bankAccount/bankAccount.repository.js"; // اضافه شد

const _buildInvoiceItems = (cartItems) => {
  return cartItems.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    purchasePrice: item.purchasePrice,
    salePrice: item.salePrice,
    lineTotal: item.purchasePrice * item.quantity,
  }));
};

const _resolvePaymentMethodLabel = ({
  cashAmount,
  posAmount,
  transferAmount,
  creditAmount,
}) => {
  const methodsUsed = [
    cashAmount,
    posAmount,
    transferAmount,
    creditAmount,
  ].filter((amount) => amount > 0).length;

  if (methodsUsed > 1) return "MIXED";
  if (creditAmount > 0) return "CREDIT";
  if (posAmount > 0) return "CARD";
  if (transferAmount > 0) return "TRANSFER";
  return "CASH";
};

const _validateInvoiceItems = (items) => {
  const invalidItem = items.find(
    (item) =>
      !item.quantity ||
      item.quantity <= 0 ||
      item.purchasePrice === null ||
      item.purchasePrice === undefined ||
      item.salePrice === null ||
      item.salePrice === undefined,
  );

  if (invalidItem) {
    throw new AppError(
      `لطفاً قبل از نهایی کردن فاکتور، تعداد و قیمت خرید/فروش محصول «${invalidItem.productName}» را تکمیل کنید`,
      400,
    );
  }
};

const checkout = async ({
  supplierId = null,
  cashAmount = 0,
  pos = { amount: 0, accountId: null },
  transfer = { amount: 0, accountId: null },
  creditAmount = 0,
}) => {
  const cart = await purchaseCartRepository.getActiveCart();
  if (!cart)
    throw new AppError("در حال حاضر هیچ فاکتور خرید بازی وجود ندارد", 404);
  if (cart.items.length === 0) throw new AppError("سبد خرید خالی است", 400);

  const supplier = await supplierRepository.getSupplierById(supplierId);
  if (!supplier) throw new AppError("تامین‌کننده پیدا نشد", 404);

  const accountIdsToValidate = [];
  if (pos.amount > 0 && pos.accountId) accountIdsToValidate.push(pos.accountId);
  if (transfer.amount > 0 && transfer.accountId)
    accountIdsToValidate.push(transfer.accountId);

  for (const accId of new Set(accountIdsToValidate)) {
    const account = await bankAccountRepository.getBankAccountById(accId);
    if (!account) {
      throw new AppError(
        `حساب بانکی (شناسه: ${accId}) در سیستم پیدا نشد.`,
        404,
      );
    }
    if (!account.is_active) {
      throw new AppError(
        `حساب بانکی «${account.title}» غیرفعال است و امکان ثبت تراکنش با آن وجود ندارد.`,
        400,
      );
    }
  }

  const invoiceItems = _buildInvoiceItems(cart.items);
  _validateInvoiceItems(invoiceItems);

  const subtotal = invoiceItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountAmount = cart.discountAmount ?? 0;
  const totalAmount = subtotal - discountAmount;

  const totalPaid = cashAmount + pos.amount + transfer.amount + creditAmount;
  if (totalPaid !== totalAmount) {
    throw new AppError(
      `مجموع مبالغ پرداختی (${totalPaid}) با مبلغ نهایی فاکتور (${totalAmount}) برابر نیست`,
      400,
    );
  }

  const paymentMethod = _resolvePaymentMethodLabel({
    cashAmount,
    posAmount: pos.amount,
    transferAmount: transfer.amount,
    creditAmount,
  });

  let connection;

  try {
    connection = await purchaseInvoiceRepository.getConnection();
    await connection.beginTransaction();

    const affectedRows = await purchaseCartRepository.deleteCartById(
      cart.id,
      connection,
    );
    if (affectedRows === 0) {
      throw new AppError("این فاکتور خرید قبلاً پردازش شده است", 409);
    }

    const totalQuantity = invoiceItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    const invoiceId = await purchaseInvoiceRepository.createInvoice(
      {
        supplierId,
        paymentMethod,
        discountAmount,
        creditAmount,
        totalAmount,
        totalQuantity,
      },
      connection,
    );

    const invoiceItemsForDb = invoiceItems.map(
      ({ salePrice, ...rest }) => rest,
    );

    await purchaseInvoiceRepository.createInvoiceItems(
      invoiceId,
      invoiceItemsForDb,
      connection,
    );

    for (const item of invoiceItems) {
      const product = await productRepository.getProductForUpdate(
        item.productId,
        connection,
      );

      const currentStock = product.stock ?? 0;
      const currentPurchasePrice = product.purchase_price ?? 0;
      const stockAfterPurchase = currentStock + item.quantity;

      const weightedAveragePurchasePrice =
        currentStock > 0
          ? Math.round(
              (currentStock * currentPurchasePrice +
                item.quantity * item.purchasePrice) /
                stockAfterPurchase,
            )
          : item.purchasePrice;

      await productRepository.applyPurchaseUpdate(
        item.productId,
        {
          quantity: item.quantity,
          purchasePrice: weightedAveragePurchasePrice,
          salePrice: item.salePrice,
          invoiceId,
          supplierId,
        },
        connection,
      );
    }

    const paymentsToCreate = [];

    if (cashAmount > 0) {
      paymentsToCreate.push({
        method: "CASH",
        amount: cashAmount,
        accountId: null,
      });
    }
    if (pos.amount > 0) {
      paymentsToCreate.push({
        method: "CARD",
        amount: pos.amount,
        accountId: pos.accountId,
      });
    }
    if (transfer.amount > 0) {
      paymentsToCreate.push({
        method: "TRANSFER",
        amount: transfer.amount,
        accountId: transfer.accountId,
      });
    }

    if (paymentsToCreate.length > 0) {
      await paymentRepository.createPayments(
        {
          invoiceType: "PURCHASE",
          invoiceId: invoiceId,
          personType: "SUPPLIER",
          personId: supplierId,
          payments: paymentsToCreate,
        },
        connection,
      );
    }

    if (creditAmount > 0) {
      await supplierRepository.incrementDebt(
        supplierId,
        creditAmount,
        connection,
      );
    }

    await connection.commit();

    return {
      id: invoiceId,
      supplierId,
      paymentMethod,
      discountAmount,
      creditAmount,
      totalAmount,
      totalQuantity,
      payments: paymentsToCreate,
      items: invoiceItems,
    };
  } catch (err) {
    if (connection) await connection.rollback();
    throw err;
  } finally {
    if (connection) connection.release();
  }
};

export default { checkout };
