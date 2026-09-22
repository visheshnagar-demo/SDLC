import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Attach JWT token to requests if available in localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("cloudpulse_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (email, password) => {
    const response = await apiClient.post("/api/v1/auth/login", {
      email,
      password,
    });
    return response.data;
  },
  getMe: async () => {
    const response = await apiClient.get("/api/v1/auth/me");
    return response.data;
  },
};

export const providersApi = {
  getProviders: async () => {
    const response = await apiClient.get("/api/v1/providers");
    return response.data;
  },
  createProvider: async (providerData) => {
    const response = await apiClient.post("/api/v1/providers", providerData);
    return response.data;
  },
};

export const instancesApi = {
  getInstances: async (params = {}) => {
    const response = await apiClient.get("/api/v1/instances", { params });
    return response.data;
  },
  getInstance: async (instanceId) => {
    const response = await apiClient.get(`/api/v1/instances/${instanceId}`);
    return response.data;
  },
  provisionInstance: async (instanceData) => {
    const response = await apiClient.post("/api/v1/instances", instanceData);
    return response.data;
  },
  executeAction: async (instanceId, action) => {
    const response = await apiClient.post(
      `/api/v1/instances/${instanceId}/action`,
      { action },
    );
    return response.data;
  },
};

export const metricsApi = {
  getInstanceMetrics: async (instanceId, params = {}) => {
    const response = await apiClient.get(
      `/api/v1/instances/${instanceId}/metrics`,
      { params },
    );
    return response.data;
  },
};

export const auditApi = {
  getAuditLogs: async (params = {}) => {
    const response = await apiClient.get("/api/v1/audit-logs", { params });
    return response.data;
  },
};

export const systemApi = {
  healthCheck: async () => {
    const response = await apiClient.get("/health");
    return response.data;
  },
};

export default apiClient;
