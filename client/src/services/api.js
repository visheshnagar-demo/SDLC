import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const tenantApi = {
  // List tenants with pagination and optional status filter
  getTenants: async (params = {}) => {
    const { skip = 0, limit = 20, status = null } = params;
    const queryParams = new URLSearchParams();
    queryParams.append("skip", skip.toString());
    queryParams.append("limit", limit.toString());
    if (status && status !== "ALL") {
      queryParams.append("status", status);
    }
    const response = await apiClient.get(
      `/api/v1/tenants?${queryParams.toString()}`,
    );
    return response.data;
  },

  // Create/provision a new tenant
  createTenant: async (tenantData) => {
    const response = await apiClient.post("/api/v1/tenants", tenantData);
    return response.data;
  },

  // Get single tenant detail
  getTenantDetails: async (id) => {
    const response = await apiClient.get(`/api/v1/tenants/${id}`);
    return response.data;
  },

  // Update tenant metadata
  updateTenant: async (id, updateData) => {
    const response = await apiClient.put(`/api/v1/tenants/${id}`, updateData);
    return response.data;
  },

  // Soft delete tenant
  deleteTenant: async (id) => {
    const response = await apiClient.delete(`/api/v1/tenants/${id}`);
    return response.data;
  },

  // Update tenant status (ACTIVE, SUSPENDED, CANCELLED)
  updateTenantStatus: async (id, status) => {
    const response = await apiClient.patch(`/api/v1/tenants/${id}/status`, {
      status,
    });
    return response.data;
  },

  // Domains
  getDomains: async (id) => {
    const response = await apiClient.get(`/api/v1/tenants/${id}/domains`);
    return response.data;
  },

  addDomain: async (id, domainData) => {
    const response = await apiClient.post(
      `/api/v1/tenants/${id}/domains`,
      domainData,
    );
    return response.data;
  },

  deleteDomain: async (id, domainId) => {
    const response = await apiClient.delete(
      `/api/v1/tenants/${id}/domains/${domainId}`,
    );
    return response.data;
  },

  // Usage & Quotas
  getTenantUsage: async (id) => {
    const response = await apiClient.get(`/api/v1/tenants/${id}/usage`);
    return response.data;
  },

  // Audit Logs
  getAuditLogs: async (id, params = {}) => {
    const { skip = 0, limit = 50 } = params;
    const response = await apiClient.get(
      `/api/v1/tenants/${id}/audit-logs?skip=${skip}&limit=${limit}`,
    );
    return response.data;
  },

  // Subscription Tiers
  getSubscriptionTiers: async () => {
    const response = await apiClient.get("/api/v1/subscription-tiers");
    return response.data;
  },

  updateSubscription: async (id, subscriptionData) => {
    const response = await apiClient.put(
      `/api/v1/tenants/${id}/subscription`,
      subscriptionData,
    );
    return response.data;
  },
};

export default tenantApi;
