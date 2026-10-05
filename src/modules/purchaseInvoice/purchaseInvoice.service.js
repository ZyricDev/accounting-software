import AppError from "../../shared/errors/AppError.js";
import purchaseCartRepository from "../purchaseCart/purchaseCart.repository.js";
import supplierRepository from "../supplier/supplier.repository.js";
import productRepository from "../product/product.repository.js";
import purchaseInvoiceRepository from "./purchaseInvoice.repository.js";
import paymentRepository from "../payment/payment.repository.js";
import { validateBankAccounts } from "../../shared/utils/bankAccountValidator.js";
import { generatePaginationData } from "../../shared/utils/apiResponse.js";

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

const _toInvoiceApiFields = (dbRow) => ({
  id: dbRow.id,
  status: dbRow.status,
  hasReturn: Boolean(dbRow.has_return),
  supplierId: dbRow.supplier_id,

  paymentMethod: dbRow.payment_method,
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
  purchasePrice: Number(dbRow.purchase_price),
  lineTotal: Number(dbRow.line_total),
});

const addPurchaseInvoice = async ({
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

  await validateBankAccounts(accountIdsToValidate);

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

const getPurchaseInvoices = async (filters) => {
  const supplier = await supplierRepository.getSupplierById(filters.supplierId);
  if (!supplier) {
    throw new AppError("تامین کننده یافت نشد", 404);
  }

  const { invoices, total } =
    await purchaseInvoiceRepository.getPurchaseInvoices(filters);

  return {
    invoices: invoices.map(_toInvoiceApiFields),
    pagination: generatePaginationData({
      page: filters.page,
      limit: filters.limit,
      total,
    }),
  };
};

const getPurchaseInvoiceById = async (purchaseInvoiceId) => {
  const purchaseInvoice =
    await purchaseInvoiceRepository.getPurchaseInvoiceById(purchaseInvoiceId);

  if (!purchaseInvoice) {
    throw new AppError("فاکتور فروش مدنظر یافت نشد", 404);
  }

  const items =
    await purchaseInvoiceRepository.getInvoiceItems(purchaseInvoiceId);

  return {
    ..._toInvoiceApiFields(purchaseInvoice),
    items: items.map(_toInvoiceItemApiFields),
  };
};

const cancelPurchaseInvoiceById = async (invoiceId) => {
  const invoice =
    await purchaseInvoiceRepository.getPurchaseInvoiceById(invoiceId);
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

  const items = await purchaseInvoiceRepository.getInvoiceItems(invoiceId);

  let connection;

  try {
    connection = await purchaseInvoiceRepository.getConnection();
    await connection.beginTransaction();

    for (const item of items) {
      await productRepository.adjustStock(
        item.product_id,
        -item.quantity,
        connection,
      );

      const product = await productRepository.getProductById(
        item.product_id,
        connection,
      );
      if (product) {
        let history = product.stock_history;

        history = history.filter(
          (h) => Number(h.invoiceId) !== Number(invoiceId),
        );

        const newLastStockInAt =
          history.length > 0
            ? new Date(
                Math.max(...history.map((h) => new Date(h.date).getTime())),
              )
            : null;

        await productRepository.updateStockHistory(
          item.product_id,
          JSON.stringify(history),
          newLastStockInAt,
          connection,
        );
      }
    }

    if (invoice.credit_amount > 0) {
      await supplierRepository.incrementDebt(
        invoice.supplier_id,
        -invoice.credit_amount,
        connection,
      );
    }

    await purchaseInvoiceRepository.cancelInvoiceStatus(invoiceId, connection);

    await paymentRepository.cancelPaymentsByInvoiceId(
      "PURCHASE",
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

const updatePurchaseInvoiceById = async (
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
  const oldInvoice =
    await purchaseInvoiceRepository.getPurchaseInvoiceById(invoiceId);
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

  const oldItems = await purchaseInvoiceRepository.getInvoiceItems(invoiceId);

  const accountIdsToValidate = [];
  if (pos.amount > 0 && pos.accountId) accountIdsToValidate.push(pos.accountId);
  if (transfer.amount > 0 && transfer.accountId)
    accountIdsToValidate.push(transfer.accountId);

  await validateBankAccounts(accountIdsToValidate);

  const validItems = items.filter((item) => item.quantity > 0);
  if (validItems.length === 0) {
    throw new AppError(
      "فاکتور نمی‌تواند بدون آیتم باشد. در صورت نیاز کل فاکتور را حذف (باطل) کنید.",
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
      purchasePrice: item.purchasePrice,
      lineTotal: item.purchasePrice * item.quantity,
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
    connection = await purchaseInvoiceRepository.getConnection();
    await connection.beginTransaction();

    const productDeltas = {};

    for (const oldItem of oldItems) {
      productDeltas[oldItem.product_id] = -oldItem.quantity;
    }

    for (const newItem of validItems) {
      productDeltas[newItem.productId] += newItem.quantity;
    }

    for (const [productIdStr, diff] of Object.entries(productDeltas)) {
      const productId = Number(productIdStr);

      const product = await productRepository.getProductById(
        productId,
        connection,
      );

      if (!product) throw new AppError("محصول یافت نشد", 404);

      if (diff < 0) {
        const removeAmount = Math.abs(diff);
        if (product.stock < removeAmount) {
          throw new AppError(
            `موجودی محصول "${product.name}" برای کاهش این آیتم در فاکتور کافی نیست. (موجودی: ${product.stock} | تعداد کسری: ${removeAmount})`,
            400,
          );
        }
      }

      if (diff !== 0) {
        await productRepository.adjustStock(productId, diff, connection);
      }

      let history = product.stock_history;

      history = history.filter(
        (h) => Number(h.invoiceId) !== Number(invoiceId),
      );

      const updatedItem = invoiceItems.find(
        (i) => Number(i.productId) === productId,
      );

      if (updatedItem) {
        history.push({
          invoiceId: invoiceId,
          supplierId: oldInvoice.supplier_id,
          quantity: updatedItem.quantity,
          purchasePrice: updatedItem.purchasePrice,
          date: oldInvoice.created_at,
        });
      }

      const newLastStockInAt =
        history.length > 0
          ? new Date(
              Math.max(...history.map((h) => new Date(h.date).getTime())),
            )
          : null;
      console.log("----------------->", newLastStockInAt);

      await productRepository.updateStockHistory(
        productId,
        JSON.stringify(history),
        newLastStockInAt,
        connection,
      );
    }

    if (oldInvoice.supplier_id) {
      const creditDelta = creditAmount - oldInvoice.credit_amount;

      if (creditDelta !== 0) {
        await supplierRepository.incrementDebt(
          oldInvoice.supplier_id,
          creditDelta,
          connection,
        );
      }
    }

    await purchaseInvoiceRepository.updateInvoice(
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

    await purchaseInvoiceRepository.deleteInvoiceItems(invoiceId, connection);
    await purchaseInvoiceRepository.createInvoiceItems(
      invoiceId,
      invoiceItems,
      connection,
    );

    await paymentRepository.deletePaymentsByInvoiceId(
      "PURCHASE",
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
          invoiceType: "PURCHASE",
          invoiceId: invoiceId,
          personType: "SUPPLIER",
          personId: oldInvoice.supplier_id,
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
  addPurchaseInvoice,
  getPurchaseInvoices,
  getPurchaseInvoiceById,
  cancelPurchaseInvoiceById,
  updatePurchaseInvoiceById,
};
