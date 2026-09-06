import AppError from "../../shared/errors/AppError.js";
import cartRepository from "../cart/cart.repository.js";
import customerRepository from "../customer/customer.repository.js";
import productRepository from "../product/product.repository.js";
import saleInvoiceRepository from "./saleInvoice.repository.js";
import paymentRepository from "../payment/payment.repository.js";

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
  electronicAmount,
  creditAmount,
}) => {
  const methodsUsed = [cashAmount, electronicAmount, creditAmount].filter(
    (amount) => amount > 0,
  ).length;

  if (methodsUsed > 1) return "MIXED";
  if (creditAmount > 0) return "CREDIT";
  if (electronicAmount > 0) return "ELECTRONIC";
  return "CASH";
};

const checkout = async (
  cartId,
  {
    cashAmount = 0,
    electronicAmount = 0,
    creditAmount = 0,
    customerName = null,
    customerPhone = null,
  },
) => {
  const cart = await cartRepository.getCartById(cartId);
  if (!cart) throw new AppError("سبد خرید پیدا نشد", 404);
  if (cart.items.length === 0) throw new AppError("سبد خرید خالی است", 400);

  const invoiceItems = _buildInvoiceItems(cart.items);
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountAmount = cart.discountAmount ?? 0;
  const totalAmount = subtotal - discountAmount;

  const totalPaid = cashAmount + electronicAmount + creditAmount;
  if (totalPaid !== totalAmount) {
    throw new AppError(
      `مجموع مبالغ پرداختی (${totalPaid}) با مبلغ نهایی فاکتور (${totalAmount}) برابر نیست`,
      400,
    );
  }

  const paymentMethod = _resolvePaymentMethodLabel({
    cashAmount,
    electronicAmount,
    creditAmount,
  });

  let connection;
  let customerId = null;

  try {
    connection = await saleInvoiceRepository.getConnection();
    await connection.beginTransaction();

    if (customerPhone) {
      customerId = await customerRepository.findOrCreateCustomer(
        { customerName, customerPhone },
        connection,
      );
    }

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
    if (cashAmount > 0)
      paymentsToCreate.push({ method: "CASH", amount: cashAmount });
    if (electronicAmount > 0)
      paymentsToCreate.push({ method: "ELECTRONIC", amount: electronicAmount });

    if (paymentsToCreate.length > 0) {
      await paymentRepository.createPayments(
        "SALE",
        invoiceId,
        paymentsToCreate,
        connection,
      );
    }

    if (creditAmount > 0) {
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

export default { checkout };
