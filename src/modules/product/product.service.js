import productRepository from "./product.repository.js";
import AppError from "../../shared/errors/AppError.js";

const FIELD_NAME_MAP = {
  purchasePrice: "purchase_price",
  salePrice: "sale_price",
};

const _toDbFields = (data) => {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [FIELD_NAME_MAP[key] ?? key, value]),
  );
};

const _toApiFields = (dbRow) => ({
  id: dbRow.id,
  name: dbRow.name,
  barcode: dbRow.barcode,
  stock: dbRow.stock,
  purchasePrice: dbRow.purchase_price,
  salePrice: dbRow.selling_price,
  lastStockInAt: dbRow.last_stock_in_at,
});

const addProduct = async (productData) => {
  const { name, barcode } = productData;

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
    ..._toDbFields(productData),
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
