import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request interceptor to dynamically attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle unified error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred";
    return Promise.reject(
      new Error(
        typeof message === "object" ? JSON.stringify(message) : message,
      ),
    );
  },
);

export const authService = {
  login: async (email, password) => {
    const response = await api.post("/api/v1/auth/login", { email, password });
    if (response.data?.access_token) {
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get("/api/v1/auth/me");
    return response.data;
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
  getStoredUser: () => {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },
  getStoredToken: () => {
    return localStorage.getItem("token");
  },
};

export const visitorService = {
  getHosts: async () => {
    const response = await api.get("/api/v1/visitors/hosts");
    return response.data;
  },
  register: async (payload) => {
    const response = await api.post("/api/v1/visitors/register", payload);
    return response.data;
  },
};

export const approvalService = {
  getPendingApprovals: async (params = {}) => {
    const response = await api.get("/api/v1/approvals/pending", { params });
    return response.data;
  },
  processAction: async (visitId, { action, approval_notes }) => {
    const response = await api.post(`/api/v1/approvals/${visitId}/action`, {
      action,
      approval_notes,
    });
    return response.data;
  },
};

export const checkinService = {
  lookup: async (params = {}) => {
    const response = await api.get("/api/v1/checkin/lookup", { params });
    return response.data;
  },
  checkIn: async (visitId, badgeId = null) => {
    const payload = badgeId ? { badge_id: badgeId } : {};
    const response = await api.post(
      `/api/v1/checkin/${visitId}/check-in`,
      payload,
    );
    return response.data;
  },
  checkOut: async (visitId) => {
    const response = await api.post(`/api/v1/checkin/${visitId}/check-out`);
    return response.data;
  },
};

export const historyService = {
  getHistory: async (params = {}) => {
    const response = await api.get("/api/v1/history", { params });
    return response.data;
  },
  exportCsv: async (params = {}) => {
    const response = await api.get("/api/v1/history/export", {
      params,
      responseType: "blob",
    });
    return response.data;
  },
};

export default api;
