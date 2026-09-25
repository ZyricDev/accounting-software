import AppError from "../../shared/errors/AppError.js";
import cartRepository from "../cart/cart.repository.js";
import customerRepository from "../customer/customer.repository.js";
import productRepository from "../product/product.repository.js";
import saleInvoiceRepository from "./saleInvoice.repository.js";
import paymentRepository from "../payment/payment.repository.js";
import { validateBankAccounts } from "../../shared/utils/bankAccountValidator.js";
import { generatePaginationData } from "../../shared/utils/apiResponse.js";

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
  customerId: dbRow.customer_id,
  customerName: dbRow.customer_name || "مشتری عبوری",
  customerPhone: dbRow.customer_phone || null,

  paymentMethod: dbRow.payment_method,
  discountAmount: Number(dbRow.discount_amount),
  creditAmount: Number(dbRow.credit_amount),
  totalAmount: Number(dbRow.total_amount),
  totalQuantity: Number(dbRow.total_quantity),
  createdAt: dbRow.created_at,
});

const _toInvoiceItemApiFields = (dbRow) => ({
  id: dbRow.id,
  productId: dbRow.product_id,
  productName: dbRow.product_name,
  quantity: Number(dbRow.quantity),
  salePrice: Number(dbRow.sale_price),
  purchasePrice: Number(dbRow.purchase_price),
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

  if (customerId) {
    const customer = await customerRepository.getCustomerById(customerId);
    if (!customer) {
      throw new AppError("مشتری یافت نشد", 404);
    }
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
      },
      connection,
    );

    await saleInvoiceRepository.createInvoiceItems(
      invoiceId,
      invoiceItems,
      connection,
    );

    for (const item of invoiceItems) {
      await productRepository.decrementStock(
        item.productId,
        item.quantity,
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

    if (creditAmount > 0 && customerId) {
      await customerRepository.incrementDebt(
        customerId,
        creditAmount,
        connection,
      );
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
    saleInvoices: invoices.map(_toInvoiceApiFields),
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

export default { addSaleInvoice, getSaleInvoices, getSaleInvoiceById };
