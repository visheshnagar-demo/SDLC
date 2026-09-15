import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token and X-Tenant-ID header if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const activeTenantId = localStorage.getItem("active_tenant_id");
    if (activeTenantId) {
      config.headers["X-Tenant-ID"] = activeTenantId;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export const authApi = {
  login: async (email, password) => {
    const response = await api.post("/api/v1/auth/login", { email, password });
    if (response.data?.access_token) {
      localStorage.setItem("access_token", response.data.access_token);
    }
    return response.data;
  },
};

export const tenantApi = {
  listTenants: async (params = {}) => {
    const response = await api.get("/api/v1/tenants", { params });
    return response.data;
  },

  onboardTenant: async (data) => {
    const response = await api.post("/api/v1/tenants", data);
    return response.data;
  },

  getTenantDetails: async (tenantId) => {
    const response = await api.get(`/api/v1/tenants/${tenantId}`);
    return response.data;
  },

  updateTenantStatus: async (tenantId, status) => {
    const response = await api.patch(`/api/v1/tenants/${tenantId}/status`, {
      status,
    });
    return response.data;
  },

  listTenantUsers: async (tenantId, params = {}) => {
    const response = await api.get(`/api/v1/tenants/${tenantId}/users`, {
      params,
    });
    return response.data;
  },

  inviteTenantUser: async (tenantId, userData) => {
    const response = await api.post(
      `/api/v1/tenants/${tenantId}/users`,
      userData,
    );
    return response.data;
  },

  revokeTenantUser: async (tenantId, userId) => {
    const response = await api.delete(
      `/api/v1/tenants/${tenantId}/users/${userId}`,
    );
    return response.data;
  },

  getTenantConfig: async (tenantId) => {
    const response = await api.get(`/api/v1/tenants/${tenantId}/config`);
    return response.data;
  },

  updateTenantConfig: async (tenantId, configData) => {
    const response = await api.put(
      `/api/v1/tenants/${tenantId}/config`,
      configData,
    );
    return response.data;
  },

  getTenantAuditLogs: async (tenantId, params = {}) => {
    const response = await api.get(`/api/v1/tenants/${tenantId}/audit-logs`, {
      params,
    });
    return response.data;
  },
};

export default api;
