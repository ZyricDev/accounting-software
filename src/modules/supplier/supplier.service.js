import AppError from "../../shared/errors/AppError.js";
import { generatePaginationData } from "../../shared/utils/apiResponse.js";
import supplierRepository from "./supplier.repository.js";

const _toApiFields = (data) => ({
  id: data.id,
  name: data.name,
  phone: data.phone,
  address: data.address,
  currentBalance: data.current_balance,
  isBlocked: Boolean(data.is_blocked),
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const addSupplier = async ({ name, phone, address }) => {
  const phoneExist = await supplierRepository.isSupplierPhoneTaken(phone);
  if (phoneExist) {
    throw new AppError("تامین‌کننده با این شماره تلفن موجود است", 409);
  }

  const now = new Date();
  const payload = {
    name,
    phone,
    address,
    current_balance: 0,
    is_blocked: false,
    created_at: now,
    updated_at: now,
  };
  const supplier = await supplierRepository.createSupplier(payload);

  return _toApiFields(supplier);
};

const getSuppliers = async (filters) => {
  const { suppliers, total } = await supplierRepository.getSuppliers(filters);

  return {
    suppliers: suppliers.map(_toApiFields),
    pagination: generatePaginationData({
      page: filters.page,
      limit: filters.limit,
      total,
    }),
  };
};

const getSupplierById = async (supplierId) => {
  const supplier = await supplierRepository.getSupplierById(supplierId);
  if (!supplier) {
    throw new AppError("تامین کننده یافت نشد", 404);
  }

  return _toApiFields(supplier);
};



export default { addSupplier, getSuppliers, getSupplierById };
