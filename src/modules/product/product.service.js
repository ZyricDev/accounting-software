import productRepository from "./product.repository.js";
import AppError from "../../shared/errors/AppError.js";
import { generatePaginationData } from "../../shared/utils/apiResponse.js";

const FIELD_NAME_MAP = {
  purchasePrice: "purchase_price",
  salePrice: "sale_price",
  stockHistory: "stock_history",
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
  const { name, barcode, stock, purchasePrice } = productData;

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
  const stockHistory = [_buildStockEntry(stock, purchasePrice)];

  const payload = {
    ..._toDbFields(productData),
    stock_history: stockHistory,
    last_stock_in_at: now,
    created_at: now,
    updated_at: now,
    deleted_at: null,
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

  await productRepository.softDeleteProduct(productId, new Date());

  return { name: product.name };
};

const addStockEntry = async (productId, stockEntryData) => {
  const product = await productRepository.getProductById(productId);
  if (!product) {
    throw new AppError("محصول پیدا نشد", 404);
  }

  const stockUpdate = _calculateStockUpdate(product, stockEntryData);

  const updatedProduct = await productRepository.setStockInfo(
    productId,
    stockUpdate,
  );

  return _toApiFields(updatedProduct);
};

export default {
  getProducts,
  addProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  addStockEntry,
};
