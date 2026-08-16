import productRepository from "./product.repository.js";
import AppError from "../../shared/errors/AppError.js";

const addProduct = async (productData) => {
  const { name, barcode, stock, purchasePrice, salePrice } = productData;

  const [nameExist, barcodeExist] = await Promise.all([
    productRepository.isProductNameTaken(name),
    productRepository.isBarcodeTaken(barcode),
  ]);
  if (nameExist) {
    throw new AppError("محصول با این نام در انبار موجود است", 409);
  }

  if (barcodeExist) {
    throw new AppError("محصول با این بارکد در انبار موجود است", 409);
  }

  const now = new Date();

  const payload = {
    name,
    barcode,
    stock,
    purchase_price: purchasePrice,
    sale_price: salePrice,
    last_stock_in_at: now,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  const deletedProduct =
    await productRepository.findDeletedProductByBarcode(barcode);

  const savedProduct = deletedProduct
    ? await productRepository.restoreProduct(deletedProduct.id, payload)
    : await productRepository.createProduct(payload);

  return {
    id: savedProduct.id,
    ...productData,
    lastStockInAt: savedProduct.last_stock_in_at,
  };
};

export default { addProduct };
