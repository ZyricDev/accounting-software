import productRepository from "./product.repository.js";
import AppError from "../../shared/errors/AppError.js";
import { generatePaginationData } from "../../shared/utils/apiResponse.js";

const _toApiFields = (dbRow) => ({
  id: dbRow.id,
  name: dbRow.name,
  barcode: dbRow?.barcode,
  stock: dbRow.stock,
  purchasePrice: dbRow.purchase_price,
  salePrice: dbRow.sale_price,
  lastStockInAt: dbRow.last_stock_in_at,
  stockHistory: dbRow?.stock_history,
});

const _buildStockEntry = (stock, purchasePrice) => ({
  stock,
  purchasePrice,
  date: new Date(),
});

const _calculateStockUpdate = (
  existingProduct,
  { stock, purchasePrice, salePrice },
) => {
  const newEntry = _buildStockEntry(stock, purchasePrice);
  const newStock = existingProduct.stock + stock;
  const weightedAveragePrice = Math.round(
    (existingProduct.purchase_price * existingProduct.stock +
      stock * purchasePrice) /
      newStock,
  );

  return {
    stock: newStock,
    purchase_price: weightedAveragePrice,
    sale_price: salePrice,
    stock_history: [...existingProduct.stock_history, newEntry],
  };
};

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
    name,
    barcode,
    created_at: now,
    updated_at: now,
  };

  const newProduct = await productRepository.createProduct(payload);

  return _toApiFields(newProduct);
};

const getProduct = async (productId) => {
  const product = await productRepository.getProductById(productId);

  if (!product) {
    throw new AppError("محصول پیدا نشد", 404);
  }

  return _toApiFields(product);
};

const updateProduct = async (productId, productData) => {
  const { name, barcode, salePrice } = productData;
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

  const rawPayload = {
    name,
    barcode,
    sale_price: salePrice,
    updated_at: new Date(),
  };

  const payload = Object.fromEntries(
    Object.entries(rawPayload).filter(([, value]) => value !== undefined),
  );

  const updatedProduct = await productRepository.updateProduct(
    productId,
    payload,
  );

  return _toApiFields(updatedProduct);
};

const deleteProduct = async (productId) => {
  const product = await productRepository.getProductById(productId);
  if (!product) {
    throw new AppError("محصول پیدا نشد", 404);
  }

  const hasUsage = await productRepository.checkProductUsage(productId);
  if (hasUsage) {
    throw new AppError(
      "این کالا در فاکتورها استفاده شده و قابل حذف نیست.",
      409,
    );
  }

  await productRepository.hardDeleteProduct(productId);

  return { id: product.id, name: product.name };
};

export default {
  getProducts,
  addProduct,
  getProduct,
  updateProduct,
  deleteProduct,
};
