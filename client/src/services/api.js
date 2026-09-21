import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export const getDashboardSummary = async () => {
  const response = await apiClient.get("/summary");
  return response.data;
};

export const getSystemHealth = async () => {
  const response = await apiClient.get("/health");
  return response.data;
};

export const listApis = async (skip = 0, limit = 100) => {
  const response = await apiClient.get("/apis", {
    params: { skip, limit },
  });
  return response.data;
};

export const getApiDetails = async (apiId) => {
  const response = await apiClient.get(`/apis/${apiId}`);
  return response.data;
};

export const registerApi = async (apiData) => {
  const response = await apiClient.post("/apis", apiData);
  return response.data;
};

export const updateApi = async (apiId, apiData) => {
  const response = await apiClient.put(`/apis/${apiId}`, apiData);
  return response.data;
};

export const deleteApi = async (apiId) => {
  const response = await apiClient.delete(`/apis/${apiId}`);
  return response.data;
};

export const triggerApiCheck = async (apiId) => {
  const response = await apiClient.post(`/apis/${apiId}/check`);
  return response.data;
};

export const getApiLogs = async (
  apiId,
  { limit = 50, offset = 0, status_filter = "all" } = {},
) => {
  const response = await apiClient.get(`/apis/${apiId}/logs`, {
    params: { limit, offset, status_filter },
  });
  return response.data;
};

export const getApiMetrics = async (apiId, timeframe = "24h") => {
  const response = await apiClient.get(`/apis/${apiId}/metrics`, {
    params: { timeframe },
  });
  return response.data;
};

export const getGlobalFailures = async ({ limit = 20, offset = 0 } = {}) => {
  const response = await apiClient.get("/failures", {
    params: { limit, offset },
  });
  return response.data;
};
