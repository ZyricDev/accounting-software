import AppError from "../../shared/errors/AppError.js";
import cartRepository from "../cart/cart.repository.js";
import customerRepository from "../customer/customer.repository.js";
import productRepository from "../product/product.repository.js";
import invoiceRepository from "./saleInvoice.repository.js";

const _buildInvoiceItems = (cartItems) => {
  return cartItems.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    salePrice: item.salePrice,
    purchasePrice: item.purchasePrice,
    lineTotal: item.salePrice * item.quantity,
  }));
};

const checkout = async (
  cartId,
  { paymentMethod, customerName = null, customerPhone = null },
) => {
  
  const cart = await cartRepository.getCartById(cartId);
  
  if (!cart) {
    throw new AppError("سبد خرید پیدا نشد", 404);
  }

  if (cart.items.length === 0) {
    throw new AppError("سبد خرید خالی است", 400);
  }

  let connection;
  let customerId = null;

  try {
    connection = await invoiceRepository.getConnection();
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

    const invoiceItems = _buildInvoiceItems(cart.items);

    const totalAmount = invoiceItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );
    const totalQuantity = invoiceItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    const invoiceId = await invoiceRepository.createInvoice(
      { customerId, paymentMethod, totalAmount, totalQuantity },
      connection,
    );

    await invoiceRepository.createInvoiceItems(
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

    await connection.commit();

    return {
      id: invoiceId,
      customerId,
      paymentMethod,
      totalAmount,
      totalQuantity,
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
