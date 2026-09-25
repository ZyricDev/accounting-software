import AppError from "../../shared/errors/AppError.js";
import { generatePaginationData } from "../../shared/utils/apiResponse.js";
import { validateBankAccounts } from "../../shared/utils/bankAccountValidator.js";
import { cleanPayload } from "../../shared/utils/object.js";
import paymentRepository from "../payment/payment.repository.js";
import customerRepository from "./customer.repository.js";

const _toApiFields = (dbRow) => ({
  id: dbRow.id,
  name: dbRow.name,
  phone: dbRow.phone,
  initialBalance: dbRow.initial_balance,
  currentBalance: dbRow.current_balance,
  isActive: Boolean(dbRow.is_active),
  birthMonth: dbRow.birth_month,
  birthDay: dbRow.birth_day,
});

const findOrCreateCustomer = async (customerData) => {
  const rawPayload = {
    phone: customerData.phone,
    name: customerData.name,
    birth_month: customerData.birthMonth,
    birth_day: customerData.birthDay,
  };

  const customer = await customerRepository.findOrCreateCustomer(rawPayload);

  return _toApiFields(customer);
};

const addCustomer = async (customerData) => {
  const { phone, initialBalance } = customerData;
  const existingPhone = await customerRepository.isPhoneTaken(phone);
  if (existingPhone) {
    throw new AppError(" مشتری با این شماره تلفن از قبل ثبت شده است", 409);
  }

  const balanceValue =
    initialBalance.type === "CREDIT"
      ? -initialBalance.amount
      : initialBalance.amount;

  const payload = {
    phone: customerData.phone,
    name: customerData.name || null,
    birth_month: customerData.birthMonth || null,
    birth_day: customerData.birthDay || null,
    initial_balance: balanceValue,
    current_balance: balanceValue,
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

const updateCustomerById = async (customerId, customerData) => {
  const { phone, initialBalance } = customerData;

  const customer = await customerRepository.getCustomerById(customerId);
  if (!customer) {
    throw new AppError("مشتری یافت نشد", 404);
  }

  if (phone && customer.phone !== phone) {
    const existingPhone = await customerRepository.isPhoneTaken(phone);
    if (existingPhone) {
      throw new AppError(" مشتری با این شماره تلفن از قبل ثبت شده است", 409);
    }
  }

  let newInitialBalance;
  let newCurrentBalance;

  if (initialBalance) {
    const requestedInitial =
      initialBalance.type === "CREDIT"
        ? -Math.abs(initialBalance.amount)
        : Math.abs(initialBalance.amount);

    const balanceDifference = requestedInitial - customer.initial_balance;

    if (balanceDifference !== 0) {
      newInitialBalance = requestedInitial;
      newCurrentBalance = customer.current_balance + balanceDifference;
    }
  }

  const rawPayload = {
    phone: customerData.phone,
    name: customerData.name,
    birth_month: customerData.birthMonth,
    birth_day: customerData.birthDay,
    initial_balance: newInitialBalance,
    current_balance: newCurrentBalance,
  };

  const payload = cleanPayload(rawPayload);

  const updatedCustomer = await customerRepository.updateCustomerById(
    customerId,
    payload,
  );

  return _toApiFields(updatedCustomer);
};

const deleteCustomerById = async (customerId) => {
  const customer = await customerRepository.getCustomerById(customerId);
  if (!customer) {
    throw new AppError("مشتری یافت نشد", 404);
  }

  const hasUsage = await customerRepository.checkCustomerUsage(customerId);
  if (hasUsage) {
    throw new AppError(
      "این مشتری دارای تراکنش مالی است و قابل حذف نیست. لطفاً آن را غیرفعال کنید.",
      409,
    );
  }

  await customerRepository.deleteCustomerById(customerId);

  return _toApiFields(customer);
};

const toggleCustomerStatusById = async (customerId) => {
  const customer = await customerRepository.getCustomerById(customerId);
  if (!customer) {
    throw new AppError("مشتری یافت نشد", 404);
  }

  const newStatus = customer.is_active ? 0 : 1;

  await customerRepository.updateCustomerStatusById(customerId, newStatus);

  return { id: customer.id, isActive: Boolean(newStatus) };
};

const settlementCustomerById = async (
  customerId,
  {
    type,
    cashAmount = 0,
    pos = { amount: 0, accountId: null },
    transfer = { amount: 0, accountId: null },
  },
) => {
  const customer = await customerRepository.getCustomerById(customerId);
  if (!customer) {
    throw new AppError("مشتری یافت نشد", 404);
  }

  const accountIdsToValidate = [];
  if (pos.amount > 0) accountIdsToValidate.push(pos.accountId);
  if (transfer.amount > 0) accountIdsToValidate.push(transfer.accountId);

  await validateBankAccounts(accountIdsToValidate);

  const totalAmount = cashAmount + pos.amount + transfer.amount;

  const paymentsToCreate = [];
  if (cashAmount > 0) {
    paymentsToCreate.push({
      method: "CASH",
      amount: cashAmount,
      accountId: null,
    });
  }
  if (pos.amount > 0) {
    paymentsToCreate.push({
      method: "CARD",
      amount: pos.amount,
      accountId: pos.accountId,
    });
  }
  if (transfer.amount > 0) {
    paymentsToCreate.push({
      method: "TRANSFER",
      amount: transfer.amount,
      accountId: transfer.accountId,
    });
  }

  const balanceChange = type === "SETTLEMENT_IN" ? -totalAmount : totalAmount;

  let connection;
  try {
    connection = await customerRepository.getConnection();
    await connection.beginTransaction();

    await paymentRepository.createPayments(
      {
        invoiceType: type,
        invoiceId: null,
        personType: "CUSTOMER",
        personId: customerId,
        payments: paymentsToCreate,
      },
      connection,
    );

    await customerRepository.incrementDebt(
      customerId,
      balanceChange,
      connection,
    );

    await connection.commit();

    return {
      customerId,
      currentBalance: customer.current_balance + balanceChange,
      totalAmount,
      type,
    };
  } catch (err) {
    if (connection) await connection.rollback();
    throw err;
  } finally {
    if (connection) connection.release();
  }
};

export default {
  findOrCreateCustomer,
  addCustomer,
  getCustomers,
  getCustomerById,
  updateCustomerById,
  deleteCustomerById,
  toggleCustomerStatusById,
  settlementCustomerById,
};
