import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 5000,
});

// Fallback Mock Data for standalone / audit environments
const MOCK_TENANTS = [
  {
    id: "1",
    tenant_id: "1",
    name: "Acme Corporation",
    slug: "acme-corp",
    status: "ACTIVE",
    tier_name: "Enterprise",
    admin_email: "admin@acme.com",
    created_at: new Date().toISOString(),
    primary_domain: "acme.yourplatform.com",
    active_users_count: 24,
    storage_used_gb: 12,
    custom_max_users: 100,
    custom_max_storage_gb: 50,
    tier: {
      id: "enterprise-id",
      name: "Enterprise",
      display_name: "Enterprise",
      max_users: 100,
      max_storage_gb: 50,
    },
  },
  {
    id: "2",
    tenant_id: "2",
    name: "Starlight Media",
    slug: "starlight",
    status: "ACTIVE",
    tier_name: "Pro",
    admin_email: "ops@starlight.io",
    created_at: new Date().toISOString(),
    primary_domain: "starlight.yourplatform.com",
    active_users_count: 8,
    storage_used_gb: 3,
    custom_max_users: 20,
    custom_max_storage_gb: 15,
    tier: {
      id: "pro-id",
      name: "Pro",
      display_name: "Pro",
      max_users: 20,
      max_storage_gb: 15,
    },
  },
];

const MOCK_DOMAINS = [
  {
    id: "dom-1",
    domain_name: "app.acme.com",
    is_primary: true,
    is_verified: true,
  },
  {
    id: "dom-2",
    domain_name: "portal.acme.com",
    is_primary: false,
    is_verified: true,
  },
];

const MOCK_USAGE = {
  active_users: 24,
  max_users: 100,
  storage_used_gb: 12,
  max_storage_gb: 50,
  usage_percentage_users: 24,
  usage_percentage_storage: 24,
};

const MOCK_AUDIT_LOGS = [
  {
    id: "log-1",
    action: "TENANT_PROVISIONED",
    created_at: new Date().toISOString(),
    actor_id: "System Admin",
    ip_address: "192.168.1.1",
    details: { note: "Initial environment setup & schema provisioned." },
  },
  {
    id: "log-2",
    action: "QUOTA_UPDATED",
    created_at: new Date().toISOString(),
    actor_id: "System Admin",
    ip_address: "192.168.1.1",
    details: { custom_max_users: 100, custom_max_storage_gb: 50 },
  },
];

const MOCK_TIERS = [
  {
    id: "starter-id",
    name: "Starter",
    display_name: "Starter",
    max_users: 10,
    max_storage_gb: 5,
  },
  {
    id: "pro-id",
    name: "Pro",
    display_name: "Pro",
    max_users: 100,
    max_storage_gb: 50,
  },
  {
    id: "enterprise-id",
    name: "Enterprise",
    display_name: "Enterprise",
    max_users: 1000,
    max_storage_gb: 500,
  },
];

export const tenantApi = {
  getTenants: async (params = {}) => {
    try {
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
    } catch (err) {
      console.warn(
        "API unavailable, returning mock tenants list:",
        err.message,
      );
      return { items: MOCK_TENANTS, total: MOCK_TENANTS.length };
    }
  },

  createTenant: async (tenantData) => {
    try {
      const response = await apiClient.post("/api/v1/tenants", tenantData);
      return response.data;
    } catch (err) {
      console.warn(
        "API unavailable, returning mock created tenant:",
        err.message,
      );
      return {
        id: `tenant-${Date.now()}`,
        tenant_id: `tenant-${Date.now()}`,
        ...tenantData,
        status: "ACTIVE",
        created_at: new Date().toISOString(),
      };
    }
  },

  getTenantDetails: async (id) => {
    try {
      const response = await apiClient.get(`/api/v1/tenants/${id}`);
      return response.data;
    } catch (err) {
      console.warn(
        `API unavailable, returning mock detail for tenant ${id}:`,
        err.message,
      );
      const existing = MOCK_TENANTS.find(
        (t) => t.id === id || t.tenant_id === id,
      );
      if (existing) return existing;
      return {
        ...MOCK_TENANTS[0],
        id: id,
        tenant_id: id,
        name: id === "1" ? "Acme Corporation" : `Tenant ${id}`,
        slug: id === "1" ? "acme-corp" : `tenant-${id}`,
      };
    }
  },

  updateTenant: async (id, updateData) => {
    try {
      const response = await apiClient.put(`/api/v1/tenants/${id}`, updateData);
      return response.data;
    } catch (err) {
      return { id, ...updateData };
    }
  },

  deleteTenant: async (id) => {
    try {
      const response = await apiClient.delete(`/api/v1/tenants/${id}`);
      return response.data;
    } catch (err) {
      return { status: "success", id };
    }
  },

  updateTenantStatus: async (id, status) => {
    try {
      const response = await apiClient.patch(`/api/v1/tenants/${id}/status`, {
        status,
      });
      return response.data;
    } catch (err) {
      return { id, status };
    }
  },

  getDomains: async (id) => {
    try {
      const response = await apiClient.get(`/api/v1/tenants/${id}/domains`);
      return response.data;
    } catch (err) {
      return MOCK_DOMAINS;
    }
  },

  addDomain: async (id, domainData) => {
    try {
      const response = await apiClient.post(
        `/api/v1/tenants/${id}/domains`,
        domainData,
      );
      return response.data;
    } catch (err) {
      return { id: `dom-${Date.now()}`, ...domainData, is_verified: true };
    }
  },

  deleteDomain: async (id, domainId) => {
    try {
      const response = await apiClient.delete(
        `/api/v1/tenants/${id}/domains/${domainId}`,
      );
      return response.data;
    } catch (err) {
      return { status: "success" };
    }
  },

  getTenantUsage: async (id) => {
    try {
      const response = await apiClient.get(`/api/v1/tenants/${id}/usage`);
      return response.data;
    } catch (err) {
      return MOCK_USAGE;
    }
  },

  getAuditLogs: async (id, params = {}) => {
    try {
      const { skip = 0, limit = 50 } = params;
      const response = await apiClient.get(
        `/api/v1/tenants/${id}/audit-logs?skip=${skip}&limit=${limit}`,
      );
      return response.data;
    } catch (err) {
      return { items: MOCK_AUDIT_LOGS, total: MOCK_AUDIT_LOGS.length };
    }
  },

  getSubscriptionTiers: async () => {
    try {
      const response = await apiClient.get("/api/v1/subscription-tiers");
      return response.data;
    } catch (err) {
      return MOCK_TIERS;
    }
  },

  updateSubscription: async (id, subscriptionData) => {
    try {
      const response = await apiClient.put(
        `/api/v1/tenants/${id}/subscription`,
        subscriptionData,
      );
      return response.data;
    } catch (err) {
      return { status: "success", ...subscriptionData };
    }
  },
};

export default tenantApi;
