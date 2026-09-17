import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Analytics & Dashboard
export const getDashboardMetrics = async () => {
  const response = await api.get("/api/v1/analytics/dashboard");
  return response.data;
};

// Chips Inventory
export const getChips = async () => {
  const response = await api.get("/api/v1/chips");
  return response.data;
};

export const createChip = async (chipData) => {
  const response = await api.post("/api/v1/chips", chipData);
  return response.data;
};

export const getChipDetails = async (chipId) => {
  const response = await api.get(`/api/v1/chips/${chipId}`);
  return response.data;
};

export const addInventoryBatch = async (chipId, batchData) => {
  const response = await api.post(`/api/v1/chips/${chipId}/batches`, batchData);
  return response.data;
};

export const updateChipStatus = async (chipId, status) => {
  const response = await api.patch(`/api/v1/chips/${chipId}/status`, {
    status,
  });
  return response.data;
};

// Transfers & Allocations
export const allocateChips = async (allocationData) => {
  const response = await api.post("/api/v1/transfers/allocate", allocationData);
  return response.data;
};

export const transferChips = async (transferData) => {
  const response = await api.post("/api/v1/transfers/transfer", transferData);
  return response.data;
};

export const redeemChips = async (redemptionData) => {
  const response = await api.post("/api/v1/transfers/redeem", redemptionData);
  return response.data;
};

// Accounts
export const getAccounts = async (params = { skip: 0, limit: 100 }) => {
  const response = await api.get("/api/v1/accounts", { params });
  return response.data;
};

export const createAccount = async (accountData) => {
  const response = await api.post("/api/v1/accounts", accountData);
  return response.data;
};

export const getAccountBalance = async (accountId) => {
  const response = await api.get(`/api/v1/accounts/${accountId}/balance`);
  return response.data;
};

// Audit Logs
export const getAuditLogs = async (params = {}) => {
  const response = await api.get("/api/v1/audit/logs", { params });
  return response.data;
};

export default api;
