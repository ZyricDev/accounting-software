import { sendSuccess } from "../../shared/utils/apiResponse.js";
import customerService from "./customer.service.js";

const addCustomer = async (req, res) => {
  const customerData = req.body;

  const customer = await customerService.addCustomer(customerData);

  return sendSuccess(res, "مشتری با موفقیت اضافه شد", { customer }, 201);
};

export default { addCustomer };
