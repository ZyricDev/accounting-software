import AppError from "../../shared/errors/AppError.js";
import returnInvoiceRepository from "./returnInvoice.repository.js";
import saleInvoiceRepository from "../saleInvoices/saleInvoice.repository.js";
import purchaseInvoiceRepository from "../purchaseInvoice/purchaseInvoice.repository.js";
import productRepository from "../product/product.repository.js";
import customerRepository from "../customer/customer.repository.js";
import supplierRepository from "../supplier/supplier.repository.js";
import { generatePaginationData } from "../../shared/utils/apiResponse.js";

const _toInvoiceItemApiFields = (item) => {
  return {
    id: item.id,
    productId: item.product_id,
    productName: item.product_name,
    quantity: item.quantity,
    unitPrice: item.unit_price,
    lineTotal: item.line_total,
  };
};

const _toInvoiceApiFields = (invoice) => {
  const isSaleReturn = invoice.return_type === "SALE_RETURN";

  const personName = isSaleReturn
    ? invoice.customer_name
    : invoice.supplier_name;

  const personPhone = isSaleReturn
    ? invoice.customer_phone
    : invoice.supplier_phone;

  return {
    id: invoice.id,
    returnType: invoice.return_type,
    personId: invoice.person_id,
    personName: personName || null,
    personPhone: personPhone || null,
    referenceInvoiceId: invoice.reference_invoice_id,
    totalQuantity: invoice.total_quantity,
    totalAmount: invoice.total_amount,
    status: invoice.status,
    createdAt: invoice.created_at,
    updatedAt: invoice.updated_at,
  };
};

const createReturnInvoice = async ({
  returnType,
  referenceInvoiceId,
  items,
}) => {
  const isSaleReturn = returnType === "SALE_RETURN";

  let originalInvoice = null;
  let originalItems = [];
  let personId = null;

  if (isSaleReturn) {
    originalInvoice =
      await saleInvoiceRepository.getSaleInvoiceById(referenceInvoiceId);
    if (!originalInvoice) throw new AppError("فاکتور فروش مرجع یافت نشد.", 404);

    originalItems =
      await saleInvoiceRepository.getInvoiceItems(referenceInvoiceId);
    personId = originalInvoice.customer_id;
  } else {
    originalInvoice =
      await purchaseInvoiceRepository.getPurchaseInvoiceById(
        referenceInvoiceId,
      );
    if (!originalInvoice) throw new AppError("فاکتور خرید مرجع یافت نشد.", 404);

    originalItems =
      await purchaseInvoiceRepository.getInvoiceItems(referenceInvoiceId);
    personId = originalInvoice.supplier_id;
  }

  if (originalInvoice.status === "CANCELLED") {
    throw new AppError(
      "این فاکتور باطل شده است و امکان ثبت مرجوعی برای آن وجود ندارد.",
      400,
    );
  }

  const previouslyReturned =
    await returnInvoiceRepository.getPreviouslyReturnedQuantities(
      referenceInvoiceId,
    );
  const returnedQtyMap = {};
  for (const row of previouslyReturned) {
    returnedQtyMap[row.product_id] = Number(row.total_returned);
  }

  const originalItemsMap = {};
  for (const item of originalItems) {
    originalItemsMap[item.product_id] = item;
  }

  const finalReturnItems = [];
  let totalAmount = 0;
  let totalQuantity = 0;

  for (const clientItem of items) {
    const origItem = originalItemsMap[clientItem.productId];

    if (!origItem) {
      throw new AppError(
        `محصولی با شناسه ${clientItem.productId} در فاکتور مرجع وجود ندارد.`,
        400,
      );
    }

    const alreadyReturnedQty = returnedQtyMap[clientItem.productId] || 0;
    const maxReturnableQty = origItem.quantity - alreadyReturnedQty;

    if (clientItem.quantity > maxReturnableQty) {
      if (maxReturnableQty === 0) {
        throw new AppError(
          `تمام تعداد خریداری شده از محصول "${origItem.product_name}" قبلاً مرجوع شده است.`,
          400,
        );
      } else {
        throw new AppError(
          `شما فقط می‌توانید حداکثر ${maxReturnableQty} عدد دیگر از محصول "${origItem.product_name}" را مرجوع کنید.`,
          400,
        );
      }
    }

    const unitPrice = isSaleReturn
      ? origItem.sale_price
      : origItem.purchase_price;
    const lineTotal = clientItem.quantity * unitPrice;

    finalReturnItems.push({
      productId: clientItem.productId,
      productName: origItem.product_name,
      quantity: clientItem.quantity,
      unitPrice: unitPrice,
      lineTotal: lineTotal,
    });

    totalAmount += lineTotal;
    totalQuantity += clientItem.quantity;
  }

  let connection;
  try {
    connection = await returnInvoiceRepository.getConnection();
    await connection.beginTransaction();

    const returnInvoiceId = await returnInvoiceRepository.createReturnHeader(
      {
        returnType,
        personId,
        referenceInvoiceId,
        totalQuantity,
        totalAmount,
      },
      connection,
    );

    const stockMultiplier = isSaleReturn ? 1 : -1;

    for (const returnItem of finalReturnItems) {
      await returnInvoiceRepository.createReturnItem(
        returnInvoiceId,
        returnItem,
        connection,
      );

      const stockChange = returnItem.quantity * stockMultiplier;
      await productRepository.adjustStock(
        returnItem.productId,
        stockChange,
        connection,
      );
    }

    if (personId) {
      if (isSaleReturn) {
        await customerRepository.incrementDebt(
          personId,
          -totalAmount,
          connection,
        );
      } else {
        await supplierRepository.incrementDebt(
          personId,
          -totalAmount,
          connection,
        );
      }
    }

    await connection.commit();

    return {
      id: returnInvoiceId,
    };
  } catch (err) {
    if (connection) await connection.rollback();
    throw err;
  } finally {
    if (connection) connection.release();
  }
};

const getReturnInvoices = async (filters) => {
  const { invoices, total } =
    await returnInvoiceRepository.getInvoices(filters);

  return {
    invoices: invoices.map(_toInvoiceApiFields),
    pagination: generatePaginationData({
      page: filters.page,
      limit: filters.limit,
      total,
    }),
  };
};

const getReturnInvoiceById = async (returnInvoiceId) => {
  const returnInvoice =
    await returnInvoiceRepository.getReturnInvoiceById(returnInvoiceId);

  if (!returnInvoice) {
    throw new AppError("فاکتور مرجوعی مدنظر یافت نشد", 404);
  }

  const items = await returnInvoiceRepository.getInvoiceItems(returnInvoiceId);

  return {
    ..._toInvoiceApiFields(returnInvoice),
    items: items.map(_toInvoiceItemApiFields),
  };
};

const cancelReturnInvoiceById = async (returnInvoiceId) => {
  const returnInvoice =
    await returnInvoiceRepository.getReturnInvoiceById(returnInvoiceId);
  if (!returnInvoice) {
    throw new AppError("فاکتور مرجوعی مدنظر یافت نشد", 404);
  }

  if (returnInvoice.status === "CANCELLED") {
    throw new AppError("این فاکتور مرجوعی قبلاً باطل شده است.", 400);
  }

  const items = await returnInvoiceRepository.getInvoiceItems(returnInvoiceId);

  const isSaleReturn = returnInvoice.return_type === "SALE_RETURN";
  const personId = returnInvoice.person_id;
  const totalAmount = returnInvoice.total_amount;

  let connection;

  try {
    connection = await returnInvoiceRepository.getConnection();
    await connection.beginTransaction();

    const stockMultiplier = isSaleReturn ? -1 : 1;

    for (const item of items) {
      const stockChange = item.quantity * stockMultiplier;
      await productRepository.adjustStock(
        item.product_id,
        stockChange,
        connection,
      );
    }

    if (personId) {
      if (isSaleReturn) {
        await customerRepository.incrementDebt(
          personId,
          totalAmount,
          connection,
        );
      } else {
        await supplierRepository.incrementDebt(
          personId,
          totalAmount,
          connection,
        );
      }
    }

    await returnInvoiceRepository.cancelInvoiceStatus(
      returnInvoiceId,
      connection,
    );

    await connection.commit();

    return { id: returnInvoiceId };
  } catch (err) {
    if (connection) await connection.rollback();
    throw err;
  } finally {
    if (connection) connection.release();
  }
};

export default {
  createReturnInvoice,
  getReturnInvoices,
  getReturnInvoiceById,
  cancelReturnInvoiceById,
};
