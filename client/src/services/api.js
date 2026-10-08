import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.message ||
      "An unexpected network error occurred";
    return Promise.reject(
      new Error(
        typeof message === "object" ? JSON.stringify(message) : message,
      ),
    );
  },
);

// Fixed Deposit API Endpoints
export const getSavingsAccounts = async () => {
  const response = await apiClient.get("/api/v1/savings-accounts");
  return response.data;
};

export const getFixedDepositRates = async (params = {}) => {
  const response = await apiClient.get("/api/v1/fixed-deposits/rates", {
    params,
  });
  return response.data;
};

export const createFixedDeposit = async (payload) => {
  const response = await apiClient.post("/api/v1/fixed-deposits", payload);
  return response.data;
};

export const getFDReceipt = async (fdId) => {
  const response = await apiClient.get(
    `/api/v1/fixed-deposits/${fdId}/receipt`,
  );
  return response.data;
};

// Legacy / Payment Gateway Endpoints for backward compatibility
export const createCheckoutSession = async (payload) => {
  const response = await apiClient.post(
    "/api/v1/payments/checkout-session",
    payload,
  );
  return response.data;
};

export const payWithDigitalWallet = async (payload) => {
  const response = await apiClient.post(
    "/api/v1/payments/digital-wallet",
    payload,
  );
  return response.data;
};

export const getExchangeRates = async (baseCurrency = "USD") => {
  const response = await apiClient.get("/api/v1/payments/rates", {
    params: { base_currency: baseCurrency },
  });
  return response.data;
};

export const listTransactions = async (params = {}) => {
  const response = await apiClient.get("/api/v1/payments/transactions", {
    params,
  });
  return response.data;
};

export const getTransactionDetail = async (transactionId) => {
  const response = await apiClient.get(
    `/api/v1/payments/transactions/${transactionId}`,
  );
  return response.data;
};

export const createRefund = async (payload) => {
  const response = await apiClient.post("/api/v1/refunds", payload);
  return response.data;
};

export const listRefunds = async (params = {}) => {
  const response = await apiClient.get("/api/v1/refunds", { params });
  return response.data;
};

export const listAuditLogs = async (params = {}) => {
  const response = await apiClient.get("/api/v1/audit-logs", { params });
  return response.data;
};

export default {
  apiClient,
  getSavingsAccounts,
  getFixedDepositRates,
  createFixedDeposit,
  getFDReceipt,
  createCheckoutSession,
  payWithDigitalWallet,
  getExchangeRates,
  listTransactions,
  getTransactionDetail,
  createRefund,
  listRefunds,
  listAuditLogs,
};
