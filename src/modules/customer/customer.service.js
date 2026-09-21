import AppError from "../../shared/errors/AppError.js";
import { generatePaginationData } from "../../shared/utils/apiResponse.js";
import customerRepository from "./customer.repository.js";

const _toApiFields = (dbRow) => ({
  id: dbRow.id,
  name: dbRow.name,
  phone: dbRow.phone,
  currentBalance: dbRow.current_balance,
  birthMonth: dbRow.birth_month,
  birthDay: dbRow.birth_day,
});

const addCustomer = async (customerData) => {
  const { phone } = customerData;
  const existingPhone = await customerRepository.isPhoneTaken(phone);
  if (existingPhone) {
    throw new AppError(" مشتری با این شماره تلفن از قبل ثبت شده است", 409);
  }

  const payload = {
    phone: customerData.phone,
    name: customerData.name || null,
    birth_month: customerData.birthMonth || null,
    birth_day: customerData.birthDay || null,
    current_balance: 0,
  };

  const newCustomer = await customerRepository.createCustomer(payload);

  return _toApiFields(newCustomer);
};

const getCustomers = async (filters) => {
  const { customers, total } = await customerRepository.getCustomers(filters);

  return {
    customers: customers.map(_toApiFields),
    pagination: generatePaginationData({
      page: filters.page,
      limit: filters.limit,
      total,
    }),
  };
};

const getCustomerById = async (customerId) => {
  const customer = await customerRepository.getCustomerById(customerId);
  if (!customer) {
    throw new AppError("مشتری یافت نشد", 404);
  }

  return _toApiFields(customer);
};

export default { addCustomer, getCustomers, getCustomerById };
