import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export const apiService = {
  // APIs CRUD
  listApis: async (params = {}) => {
    const response = await apiClient.get("/api/v1/apis", { params });
    return response.data;
  },

  createApi: async (data) => {
    const response = await apiClient.post("/api/v1/apis", data);
    return response.data;
  },

  getApiById: async (id) => {
    const response = await apiClient.get(`/api/v1/apis/${id}`);
    return response.data;
  },

  updateApi: async (id, data) => {
    const response = await apiClient.put(`/api/v1/apis/${id}`, data);
    return response.data;
  },

  deleteApi: async (id) => {
    const response = await apiClient.delete(`/api/v1/apis/${id}`);
    return response.data;
  },

  // Immediate Probe Trigger
  triggerHealthCheck: async (id) => {
    const response = await apiClient.post(`/api/v1/apis/${id}/check`);
    return response.data;
  },

  // Health Logs & Metrics
  getApiHealthLogs: async (id, params = {}) => {
    const response = await apiClient.get(`/api/v1/apis/${id}/logs`, { params });
    return response.data;
  },

  getApiMetrics: async (id, params = { timeframe: "24h" }) => {
    const response = await apiClient.get(`/api/v1/apis/${id}/metrics`, {
      params,
    });
    return response.data;
  },

  // Global Failures
  getRecentFailures: async (params = {}) => {
    const response = await apiClient.get("/api/v1/failures", { params });
    return response.data;
  },

  // Liveness Check
  checkServiceHealth: async () => {
    try {
      const response = await apiClient.get("/api/v1/health");
      return response.data;
    } catch {
      const fallback = await apiClient.get("/health");
      return fallback.data;
    }
  },
};

export default apiService;
