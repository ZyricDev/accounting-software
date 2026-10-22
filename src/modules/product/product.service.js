import productRepository from "./product.repository.js";
import supplierRepository from "../supplier/supplier.repository.js";
import AppError from "../../shared/errors/AppError.js";
import { generatePaginationData } from "../../shared/utils/apiResponse.js";
import { cleanPayload } from "../../shared/utils/object.js";

const _toApiFields = (dbRow, includeHistory = true) => {
  let lastPurchasePrice = null;

  const history = dbRow.stock_history
    ? typeof dbRow.stock_history === "string"
      ? JSON.parse(dbRow.stock_history)
      : dbRow.stock_history
    : [];

  if (history.length > 0) {
    const latestRecord = history.reduce((latest, current) => {
      return new Date(current.date).getTime() > new Date(latest.date).getTime()
        ? current
        : latest;
    });

    lastPurchasePrice = latestRecord.purchasePrice;
  }

  const result = {
    id: dbRow.id,
    name: dbRow.name,
    barcodes: dbRow.barcodes,
    stock: dbRow.stock,
    purchasePrice: lastPurchasePrice,
    salePrice: dbRow.sale_price,
    lastStockInAt: dbRow.last_stock_in_at,
  };

  if (includeHistory) {
    result.stockHistory = history;
  }

  return result;
};

const getProducts = async (filters) => {
  const { products, total } = await productRepository.getProducts(filters);

  return {
    products: products.map((product) => _toApiFields(product, false)),
    pagination: generatePaginationData({
      page: filters.page,
      limit: filters.limit,
      total,
    }),
  };
};

const addProduct = async (productData) => {
  const { name, barcodes } = productData;

  const nameExist = await productRepository.isProductNameTaken(name);
  if (nameExist) {
    throw new AppError("محصول با این نام در انبار موجود است", 409);
  }

  const existingRecords = await productRepository.getExistingBarcodes(barcodes);

  if (existingRecords.length > 0) {
    const duplicateBarcodes = existingRecords.map((record) => record.barcode);

    throw new AppError(
      `بارکدهای زیر قبلاً در سیستم ثبت شده‌اند: ${duplicateBarcodes.join("، ")}`,
      409,
    );
  }

  const newProduct = await productRepository.createProductWithBarcodes({
    name,
    barcodes,
  });

  return _toApiFields(newProduct);
};

const getProduct = async (productId) => {
  const product = await productRepository.getProductById(productId);

  if (!product) {
    throw new AppError("محصول پیدا نشد", 404);
  }

  if (product.stock_history && product.stock_history.length > 0) {
    const supplierIds = [
      ...new Set(product.stock_history.map((item) => item.supplierId)),
    ].filter(Boolean);

    const suppliers = await supplierRepository.getSuppliersByIds(supplierIds);

    const supplierMap = {};
    for (const supplier of suppliers) {
      supplierMap[supplier.id] = {
        name: supplier.name,
        phone: supplier.phone,
      };
    }

    product.stock_history = product.stock_history.map((item) => {
      const supplierInfo = supplierMap[item.supplierId];

      return {
        ...item,
        supplierName: supplierInfo?.name || null,
        supplierPhone: supplierInfo?.phone || null,
      };
    });
  }

  return _toApiFields(product);
};

const updateProduct = async (productId, productData) => {
  const { name, barcodes, salePrice } = productData;
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

  if (barcodes?.length > 0) {
    const existingRecords =
      await productRepository.getExistingBarcodes(barcodes);
    const duplicateBarcodes = [];

    for (const record of existingRecords) {
      if (record.product_id !== Number(productId)) {
        duplicateBarcodes.push(record.barcode);
      }
    }

    if (duplicateBarcodes.length > 0) {
      throw new AppError(
        `بارکدهای زیر قبلاً برای محصولات دیگری ثبت شده‌اند: ${duplicateBarcodes.join("، ")}`,
        409,
      );
    }
  }

  const rawPayload = {
    name,
    barcodes,
    sale_price: salePrice,
    updated_at: new Date(),
  };

  const payload = cleanPayload(rawPayload);

  const updatedProduct = await productRepository.updateProductWithBarcodes(
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

const getProductValuation = async () => {
  const { totalProductValue, totalExpectedSales } =
    await productRepository.getProductValuation();

  const formattedData = {
    totalProductValue: Number(totalProductValue),
    totalPotentialProfit: Number(totalExpectedSales - totalProductValue),
  };

  return formattedData;
};

export default {
  getProducts,
  addProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  getProductValuation,
};
