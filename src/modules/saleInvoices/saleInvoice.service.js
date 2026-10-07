import AppError from "../../shared/errors/AppError.js";
import cartRepository from "../cart/cart.repository.js";
import customerRepository from "../customer/customer.repository.js";
import productRepository from "../product/product.repository.js";
import saleInvoiceRepository from "./saleInvoice.repository.js";
import paymentRepository from "../payment/payment.repository.js";
import { validateBankAccounts } from "../../shared/utils/bankAccountValidator.js";
import { generatePaginationData } from "../../shared/utils/apiResponse.js";
import smsService from "../../shared/utils/sms.js";

const _buildInvoiceItems = (cartItems) => {
  return cartItems.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    originalPrice: item.originalPrice,
    salePrice: item.salePrice,
    purchasePrice: item.purchasePrice,
    lineTotal: item.salePrice * item.quantity,
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

const _toInvoiceApiFields = (dbRow) => ({
  id: dbRow.id,
  status: dbRow.status,
  hasReturn: Boolean(dbRow.has_return),
  customerId: dbRow.customer_id,
  customerName: dbRow.customer_name || "بدون نام",
  customerPhone: dbRow.customer_phone || null,

  paymentMethod: dbRow.payment_method,
  discountType: dbRow.discount_type,
  discountAmount: Number(dbRow.discount_amount),
  creditAmount: Number(dbRow.credit_amount),
  totalAmount: Number(dbRow.total_amount),
  totalQuantity: Number(dbRow.total_quantity),
  createdAt: dbRow.created_at,
  updatedAt: dbRow.updated_at,
});

const _toInvoiceItemApiFields = (dbRow) => ({
  id: dbRow.id,
  productId: dbRow.product_id,
  productName: dbRow.product_name,
  quantity: Number(dbRow.quantity),
  salePrice: Number(dbRow.sale_price),
  lineTotal: Number(dbRow.line_total),
});

const addSaleInvoice = async ({
  cartId,
  cashAmount = 0,
  pos = { amount: 0, accountId: null },
  transfer = { amount: 0, accountId: null },
  creditAmount = 0,
  customerId = null,
}) => {
  const cart = await cartRepository.getCartById(cartId);
  if (!cart) throw new AppError("سبد خرید پیدا نشد", 404);
  if (cart.items.length === 0) throw new AppError("سبد خرید خالی است", 400);

  let customer;
  if (customerId) {
    customer = await customerRepository.getCustomerById(customerId);
    if (!customer) {
      throw new AppError("مشتری یافت نشد", 404);
    }
  } else {
    customerId = await customerRepository.getGuestCustomerId();
  }

  const accountIdsToValidate = [];
  if (pos.amount > 0 && pos.accountId) accountIdsToValidate.push(pos.accountId);
  if (transfer.amount > 0 && transfer.accountId)
    accountIdsToValidate.push(transfer.accountId);

  await validateBankAccounts(accountIdsToValidate);

  const invoiceItems = _buildInvoiceItems(cart.items);
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
    connection = await saleInvoiceRepository.getConnection();
    await connection.beginTransaction();

    const affectedRows = await cartRepository.deleteCartById(
      cartId,
      connection,
    );
    if (affectedRows === 0) {
      throw new AppError("این سبد خرید پردازش شده است", 409);
    }

    const totalQuantity = invoiceItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    const invoiceId = await saleInvoiceRepository.createInvoice(
      {
        customerId,
        paymentMethod,
        discountAmount,
        creditAmount,
        totalAmount,
        totalQuantity,
        discount_type: cart.discountType,
      },
      connection,
    );

    await saleInvoiceRepository.createInvoiceItems(
      invoiceId,
      invoiceItems,
      connection,
    );

    for (const item of invoiceItems) {
      await productRepository.adjustStock(
        item.productId,
        -item.quantity,
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
          invoiceType: "SALE",
          invoiceId: invoiceId,
          personType: "CUSTOMER",
          personId: customerId,
          payments: paymentsToCreate,
        },
        connection,
      );
    }

    if (creditAmount > 0) {
      await customerRepository.incrementDebt(
        customerId,
        creditAmount,
        connection,
      );
    } else {
      if (customer) {
        smsService.sendPurchaseDiscountSMS(
          customer.name,
          customer.phone,
          totalAmount,
        );
      }
    }

    await connection.commit();

    return {
      id: invoiceId,
      customerId,
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

const getSaleInvoices = async (filters) => {
  const { invoices, total } = await saleInvoiceRepository.getInvoices(filters);

  return {
    invoices: invoices.map(_toInvoiceApiFields),
    pagination: generatePaginationData({
      page: filters.page,
      limit: filters.limit,
      total,
    }),
  };
};

const getSaleInvoiceById = async (saleInvoiceId) => {
  const saleInvoice =
    await saleInvoiceRepository.getSaleInvoiceById(saleInvoiceId);

  if (!saleInvoice) {
    throw new AppError("فاکتور فروش مدنظر یافت نشد", 404);
  }

  const items = await saleInvoiceRepository.getInvoiceItems(saleInvoiceId);

  return {
    ..._toInvoiceApiFields(saleInvoice),
    items: items.map(_toInvoiceItemApiFields),
  };
};

const cancelSaleInvoiceById = async (invoiceId) => {
  const invoice = await saleInvoiceRepository.getSaleInvoiceById(invoiceId);
  if (!invoice) {
    throw new AppError("فاکتور مدنظر یافت نشد", 404);
  }

  if (invoice.status === "CANCELLED") {
    throw new AppError("این فاکتور قبلاً باطل شده است.", 400);
  }

  if (invoice.has_return) {
    throw new AppError(
      "این فاکتور دارای سند مرجوعی فعال است و امکان ابطال آن وجود ندارد. لطفاً ابتدا مرجوعی را باطل کنید.",
      400,
    );
  }

  const items = await saleInvoiceRepository.getInvoiceItems(invoiceId);

  let connection;

  try {
    connection = await saleInvoiceRepository.getConnection();
    await connection.beginTransaction();

    for (const item of items) {
      await productRepository.adjustStock(
        item.product_id,
        item.quantity,
        connection,
      );
    }

    if (invoice.credit_amount > 0) {
      await customerRepository.incrementDebt(
        invoice.customer_id,
        -invoice.credit_amount,
        connection,
      );
    }

    await saleInvoiceRepository.cancelInvoiceStatus(invoiceId, connection);

    await paymentRepository.cancelPaymentsByInvoiceId(
      "SALE",
      invoiceId,
      connection,
    );

    await connection.commit();

    return { id: invoiceId };
  } catch (err) {
    if (connection) await connection.rollback();
    throw err;
  } finally {
    if (connection) connection.release();
  }
};

const updateSaleInvoiceById = async (
  invoiceId,
  {
    items,
    discountAmount = 0,
    cashAmount = 0,
    pos = { amount: 0, accountId: null },
    transfer = { amount: 0, accountId: null },
    creditAmount = 0,
  },
) => {
  const oldInvoice = await saleInvoiceRepository.getSaleInvoiceById(invoiceId);
  if (!oldInvoice) throw new AppError("فاکتور مدنظر یافت نشد", 404);

  if (oldInvoice.status === "CANCELLED") {
    throw new AppError(
      "این فاکتور باطل شده است و امکان ویرایش آن وجود ندارد.",
      403,
    );
  }

  if (oldInvoice.has_return) {
    throw new AppError(
      "این فاکتور دارای سند مرجوعی فعال است و امکان ویرایش آن وجود ندارد. لطفاً ابتدا مرجوعی را باطل کنید.",
      400,
    );
  }

  const oldItems = await saleInvoiceRepository.getInvoiceItems(invoiceId);

  const accountIdsToValidate = [];
  if (pos.amount > 0 && pos.accountId) accountIdsToValidate.push(pos.accountId);
  if (transfer.amount > 0 && transfer.accountId)
    accountIdsToValidate.push(transfer.accountId);

  await validateBankAccounts(accountIdsToValidate);

  const validItems = items.filter((item) => item.quantity > 0);

  if (validItems.length === 0) {
    throw new AppError(
      "فاکتور نمی‌تواند بدون آیتم باشد. در صورت نیاز کل فاکتور را حذف کنید.",
      400,
    );
  }

  const oldItemsMap = {};
  for (const old of oldItems) {
    oldItemsMap[old.product_id] = old;
  }

  for (const item of validItems) {
    if (!oldItemsMap[item.productId]) {
      throw new AppError(
        `امکان اضافه کردن محصول جدید به فاکتور صادر شده وجود ندارد. برای اقلام جدید، فاکتور مجزا ثبت کنید.`,
        400,
      );
    }
  }

  const invoiceItems = validItems.map((item) => {
    const oldItem = oldItemsMap[item.productId];
    return {
      productId: item.productId,
      productName: oldItem.product_name,
      quantity: item.quantity,
      salePrice: item.salePrice,
      originalPrice: oldItem.original_price,
      purchasePrice: oldItem.purchase_price,
      lineTotal: item.salePrice * item.quantity,
    };
  });

  const subtotal = invoiceItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalQuantity = invoiceItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
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
    connection = await saleInvoiceRepository.getConnection();
    await connection.beginTransaction();

    const productDeltas = {};

    for (const oldItem of oldItems) {
      productDeltas[oldItem.product_id] = -oldItem.quantity;
    }

    for (const newItem of validItems) {
      productDeltas[newItem.productId] += newItem.quantity;
    }

    for (const [productId, diff] of Object.entries(productDeltas)) {
      if (diff > 0) {
        const product = await productRepository.getProductById(
          productId,
          connection,
        );

        if (!product) throw new AppError("محصول یافت نشد", 404);
        if (product.stock < diff) {
          throw new AppError(
            `موجودی محصول "${product.name}" کافی نیست. (موجودی فعلی: ${product.stock} | تعداد درخواستی اضافه: ${diff})`,
            400,
          );
        }
      }

      if (diff !== 0) {
        await productRepository.adjustStock(productId, -diff, connection);
      }
    }

    const creditDelta = creditAmount - oldInvoice.credit_amount;
    if (creditDelta !== 0) {
      await customerRepository.incrementDebt(
        oldInvoice.customer_id,
        creditDelta,
        connection,
      );
    }

    await saleInvoiceRepository.updateInvoice(
      invoiceId,
      {
        paymentMethod,
        discountAmount,
        creditAmount,
        totalAmount,
        totalQuantity,
      },
      connection,
    );

    await saleInvoiceRepository.deleteInvoiceItems(invoiceId, connection);
    await saleInvoiceRepository.createInvoiceItems(
      invoiceId,
      invoiceItems,
      connection,
    );

    await paymentRepository.deletePaymentsByInvoiceId(
      "SALE",
      invoiceId,
      connection,
    );

    const paymentsToCreate = [];
    if (cashAmount > 0)
      paymentsToCreate.push({
        method: "CASH",
        amount: cashAmount,
        accountId: null,
      });
    if (pos.amount > 0)
      paymentsToCreate.push({
        method: "CARD",
        amount: pos.amount,
        accountId: pos.accountId,
      });
    if (transfer.amount > 0)
      paymentsToCreate.push({
        method: "TRANSFER",
        amount: transfer.amount,
        accountId: transfer.accountId,
      });

    if (paymentsToCreate.length > 0) {
      await paymentRepository.createPayments(
        {
          invoiceType: "SALE",
          invoiceId: invoiceId,
          personType: "CUSTOMER",
          personId: oldInvoice.customer_id,
          payments: paymentsToCreate,
          originalDate: oldInvoice.created_at,
        },
        connection,
      );
    }

    await connection.commit();

    return { id: invoiceId };
  } catch (err) {
    if (connection) await connection.rollback();
    throw err;
  } finally {
    if (connection) connection.release();
  }
};

export default {
  addSaleInvoice,
  getSaleInvoices,
  getSaleInvoiceById,
  cancelSaleInvoiceById,
  updateSaleInvoiceById,
};
