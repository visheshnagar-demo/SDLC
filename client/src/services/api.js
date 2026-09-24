import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export const getAlerts = async (params = {}) => {
  const response = await apiClient.get("/api/v1/alerts", { params });
  return response.data;
};

export const getAlertById = async (id) => {
  const response = await apiClient.get(`/api/v1/alerts/${id}`);
  return response.data;
};

export const updateAlertStatus = async (id, data) => {
  const response = await apiClient.patch(`/api/v1/alerts/${id}/status`, data);
  return response.data;
};

export const getRules = async () => {
  const response = await apiClient.get("/api/v1/rules");
  return response.data;
};

export const createRule = async (ruleData) => {
  const response = await apiClient.post("/api/v1/rules", ruleData);
  return response.data;
};

export const updateRule = async (id, ruleData) => {
  const response = await apiClient.put(`/api/v1/rules/${id}`, ruleData);
  return response.data;
};

export const toggleRule = async (id, isActive) => {
  const response = await apiClient.patch(`/api/v1/rules/${id}/toggle`, {
    is_active: isActive,
  });
  return response.data;
};

export const evaluateTransaction = async (txData) => {
  const response = await apiClient.post(
    "/api/v1/transactions/evaluate",
    txData,
  );
  return response.data;
};

export const getTransactions = async (params = {}) => {
  const response = await apiClient.get("/api/v1/transactions", { params });
  return response.data;
};

export const getAuditLogs = async (params = {}) => {
  const response = await apiClient.get("/api/v1/audit-logs", { params });
  return response.data;
};

export default apiClient;
