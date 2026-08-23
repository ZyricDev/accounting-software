import productService from "./product.service.js";
import logger from "../../shared/utils/logger.js";
import { sendSuccess } from "../../shared/utils/apiResponse.js";

const getProducts = async (req, res) => {
  const result = await productService.getProducts(req.validatedQuery);

  return sendSuccess(res, "محصولات با موفقیت دریافت شد", result);
};

const addProduct = async (req, res) => {
  const productData = req.body;

  const newProduct = await productService.addProduct(productData);

  logger.info("Added new product", {
    id: newProduct.id,
    name: newProduct.name,
  });

  return sendSuccess(
    res,
    "محصول با موفقیت اضافه شد",
    { product: newProduct },
    201,
  );
};

const getProduct = async (req, res) => {
  const { id } = req.params;

  const product = await productService.getProduct(id);

  return sendSuccess(res, "محصول با موفقیت دریافت شد", { product });
};

const updateProduct = async (req, res) => {
  const productId = req.params.id;
  const productData = req.body;

  const updatedProduct = await productService.updateProduct(
    productId,
    productData,
  );

  logger.info("Updated product", {
    id: updatedProduct.id,
    name: updatedProduct.name,
  });

  return sendSuccess(res, "محصول با موفقیت بروزرسانی شد", {
    product: updatedProduct,
  });
};

const deleteProduct = async (req, res) => {
  const productId = req.params.id;

  const deletedProduct = await productService.deleteProduct(productId);

  logger.info("Deleted product", {
    id: deletedProduct.id,
    name: deletedProduct.name,
  });

  return sendSuccess(res, "محصول با موفقیت حذف شد", {
    product: { name: deletedProduct.name },
  });
};

export default {
  getProducts,
  addProduct,
  getProduct,
  updateProduct,
  deleteProduct,
};
