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
    // Standardized error payload extractions
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
  const response = await apiClient.get("/api/v1/transactions", {
    params,
  });
  return response.data;
};

export const getTransactionDetail = async (transactionId) => {
  const response = await apiClient.get(`/api/v1/transactions/${transactionId}`);
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

// Email classification endpoints
export const ingestTextEmail = async (payload) => {
  const response = await apiClient.post("/api/v1/emails/text", payload);
  return response.data;
};

export const ingestFileEmail = async (formData) => {
  const response = await apiClient.post("/api/v1/emails/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const listEmails = async (params = {}) => {
  const response = await apiClient.get("/api/v1/emails", { params });
  return response.data;
};

export const getEmailDetail = async (emailId) => {
  const response = await apiClient.get(`/api/v1/emails/${emailId}`);
  return response.data;
};

export const overrideEmailCategory = async (emailId, payload) => {
  const response = await apiClient.patch(
    `/api/v1/emails/${emailId}/override`,
    payload,
  );
  return response.data;
};

export default {
  apiClient,
  createCheckoutSession,
  payWithDigitalWallet,
  getExchangeRates,
  listTransactions,
  getTransactionDetail,
  createRefund,
  listRefunds,
  listAuditLogs,
  ingestTextEmail,
  ingestFileEmail,
  listEmails,
  getEmailDetail,
  overrideEmailCategory,
};
