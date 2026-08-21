import productRepository from "./product.repository.js";
import AppError from "../../shared/errors/AppError.js";
import { generatePaginationData } from "../../shared/utils/apiResponse.js";

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
  salePrice: dbRow.sale_price,
  lastStockInAt: dbRow.last_stock_in_at,
});

const getProducts = async (filters) => {
  const { products, total } = await productRepository.getProducts(filters);

  return {
    products: products.map(_toApiFields),
    pagination: generatePaginationData({
      page: filters.page,
      limit: filters.limit,
      total,
    }),
  };
};

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

  return _toApiFields(savedProduct);
};

const updateProduct = async (productId, productData) => {
  const { name, barcode } = productData;
  const product = await productRepository.getProductById(productId);
  if (!product) {
    throw new AppError("محصول پیدا نشد", 404);
  }

  if (name && name !== product.name) {
    const nameExist = await productRepository.isProductNameTaken(name);

    if (nameExist) {
      throw new AppError("محصول با این نام در انبار موجود است", 409);
    }
  }

  if (barcode && barcode !== product.barcode) {
    const barcodeExist = await productRepository.isBarcodeTaken(barcode);

    if (barcodeExist) {
      throw new AppError("محصول با این بارکد در انبار موجود است", 409);
    }
  }

  const now = new Date();

  const payload = {
    ..._toDbFields(productData),
    updated_at: now,
  };

  const updatedProduct = await productRepository.updateProduct(
    productId,
    payload,
  );
  console.log(_toApiFields(updatedProduct));

  return _toApiFields(updatedProduct);
};

const deleteProduct = async (productId) => {
  const product = await productRepository.getProductById(productId);
  if (!product) {
    throw new AppError("محصول پیدا نشد", 404);
  }

  const deletedProduct = await productRepository.softDeleteProduct(
    productId,
    new Date(),
  );

  return { name: deletedProduct.name };
};

export default { getProducts, addProduct, updateProduct, deleteProduct };
