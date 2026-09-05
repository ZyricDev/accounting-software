import { sendSuccess } from "../../shared/utils/apiResponse.js";
import logger from "../../shared/utils/logger.js";
import supplierService from "./supplier.service.js";

const addSupplier = async (req, res) => {
  const supplierData = req.body;

  const supplier = await supplierService.addSupplier(supplierData);

  logger.info("added supplier", {
    id: supplier.id,
    name: supplier.name,
  });

  return sendSuccess(res, "تامین‌کننده با موفقیت اضافه شد", { supplier }, 201);
};

const getSuppliers = async (req, res) => {
  const result = await supplierService.getSuppliers(req.validatedQuery);

  return sendSuccess(res, "تامین‌کننده ها با موفقیت دریافت شد", result);
};

const getSupplier = async (req, res) => {
  const supplier = await supplierService.getSupplierById(req.params.id);

  return sendSuccess(res, "تامین کننده با موفقیت دریافت شد", { supplier });
};

export default { addSupplier, getSuppliers, getSupplier };
