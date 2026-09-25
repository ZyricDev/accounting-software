import { sendSuccess } from "../../shared/utils/apiResponse.js";
import customerService from "./customer.service.js";

const findOrCreateCustomer = async (req, res) => {
  const customerData = req.body;

  const customer = await customerService.findOrCreateCustomer(customerData);

  return sendSuccess(res, "اطلاعات مشتری با موفقیت دریافت شد.", { customer });
};

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

const deleteCustomer = async (req, res) => {
  const { customerId } = req.params;

  const customer = await customerService.deleteCustomerById(customerId);

  return sendSuccess(res, "مشتری با موفقیت حذف شد", { customer });
};

const toggleCustomerStatus = async (req, res) => {
  const { customerId } = req.params;

  const customer = await customerService.toggleCustomerStatusById(customerId);

  return sendSuccess(res, "وضعیت مشتری با موفقیت تغییر کرد", { customer });
};

const settlementCustomer = async (req, res) => {
  const { customerId } = req.params;
  const settlementData = req.body;

  const result = await customerService.settlementCustomerById(
    customerId,
    settlementData,
  );

  const message =
    settlementData.type === "SETTLEMENT_OUT"
      ? "پرداخت به مشتری با موفقیت ثبت شد."
      : "دریافت وجه از مشتری با موفقیت ثبت شد.";

  return sendSuccess(res, message, result);
};

export default {
  findOrCreateCustomer,
  addCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  toggleCustomerStatus,
  settlementCustomer,
};
