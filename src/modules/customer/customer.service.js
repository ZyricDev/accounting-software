import AppError from "../../shared/errors/AppError.js";
import customerRepository from "./customer.repository.js";

const _toApiFields = (dbRow) => ({
  id: dbRow.id,
  name: dbRow.name,
  phone: dbRow.phone,
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

export default { addCustomer };
