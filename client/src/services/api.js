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

// --- Tenant Management API Endpoints ---

export const getTenants = async (params = {}) => {
  const response = await apiClient.get("/api/v1/tenants", { params });
  return response.data;
};

export const getTenantDetail = async (tenantId) => {
  const response = await apiClient.get(`/api/v1/tenants/${tenantId}`);
  return response.data;
};

export const createTenant = async (payload) => {
  const response = await apiClient.post("/api/v1/tenants", payload);
  return response.data;
};

export const updateTenant = async (tenantId, payload) => {
  const response = await apiClient.put(`/api/v1/tenants/${tenantId}`, payload);
  return response.data;
};

export const updateTenantStatus = async (tenantId, status, reason = "") => {
  const response = await apiClient.patch(`/api/v1/tenants/${tenantId}/status`, {
    status,
    reason,
  });
  return response.data;
};

export const updateTenantConfig = async (tenantId, configPayload) => {
  const response = await apiClient.put(
    `/api/v1/tenants/${tenantId}/configuration`,
    configPayload,
  );
  return response.data;
};

export const deleteTenant = async (tenantId) => {
  const response = await apiClient.delete(`/api/v1/tenants/${tenantId}`);
  return response.data;
};

// --- Legacy / Existing Payment Gateway Endpoints ---

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
  getTenants,
  getTenantDetail,
  createTenant,
  updateTenant,
  updateTenantStatus,
  updateTenantConfig,
  deleteTenant,
  createCheckoutSession,
  payWithDigitalWallet,
  getExchangeRates,
  listTransactions,
  getTransactionDetail,
  createRefund,
  listRefunds,
  listAuditLogs,
};
