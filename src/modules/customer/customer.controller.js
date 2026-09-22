import { sendSuccess } from "../../shared/utils/apiResponse.js";
import customerService from "./customer.service.js";

const addCustomer = async (req, res) => {
  const customerData = req.body;

  const customer = await customerService.addCustomer(customerData);

  return sendSuccess(res, "مشتری با موفقیت اضافه شد", { customer }, 201);
};

const getCustomers = async (req, res) => {
  const result = await customerService.getCustomers(req.validatedQuery);

  return sendSuccess(res, "مشتری ها با موفقیت دریافت شد", result);
};

const getCustomer = async (req, res) => {
  const { customerId } = req.params;

  const customer = await customerService.getCustomerById(customerId);

  return sendSuccess(res, "مشتری با موفقیت دریافت شد", { customer });
};

const updateCustomer = async (req, res) => {
  const { customerId } = req.params;
  const customerData = req.body;

  const customer = await customerService.updateCustomerById(
    customerId,
    customerData,
  );

  return sendSuccess(res, "مشتری با موفقیت آپدیت شد", { customer });
};

export default { addCustomer, getCustomers, getCustomer, updateCustomer };
