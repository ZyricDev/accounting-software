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

export default { addCustomer, getCustomers };
