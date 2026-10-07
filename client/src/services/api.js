import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Attach Authorization header if JWT token is stored
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle standard API errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired or unauthorized
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    return Promise.reject(error);
  },
);

// Auth Endpoints
export const login = async (credentials) => {
  const response = await apiClient.post("/api/v1/auth/login", credentials);
  return response.data;
};

export const register = async (userData) => {
  const response = await apiClient.post("/api/v1/auth/register", userData);
  return response.data;
};

// Cattle Inventory Endpoints
export const getCows = async (params = {}) => {
  const response = await apiClient.get("/api/v1/cows", { params });
  return response.data;
};

export const getCowById = async (id) => {
  const response = await apiClient.get(`/api/v1/cows/${id}`);
  return response.data;
};

export const createCow = async (cowData) => {
  const response = await apiClient.post("/api/v1/cows", cowData);
  return response.data;
};

export const updateCow = async (id, cowData) => {
  const response = await apiClient.put(`/api/v1/cows/${id}`, cowData);
  return response.data;
};

export const deleteCow = async (id) => {
  const response = await apiClient.delete(`/api/v1/cows/${id}`);
  return response.data;
};

// Health & Veterinary Endpoints
export const getHealthRecords = async (params = {}) => {
  const response = await apiClient.get("/api/v1/health-records", { params });
  return response.data;
};

export const createHealthRecord = async (recordData) => {
  const response = await apiClient.post("/api/v1/health-records", recordData);
  return response.data;
};

// Milk Yield Logging Endpoints
export const getMilkYields = async (params = {}) => {
  const response = await apiClient.get("/api/v1/milk-yields", { params });
  return response.data;
};

export const createMilkYield = async (yieldData) => {
  const response = await apiClient.post("/api/v1/milk-yields", yieldData);
  return response.data;
};

// Analytics Endpoints
export const getAnalyticsSummary = async () => {
  const response = await apiClient.get("/api/v1/analytics/summary");
  return response.data;
};

export const getYieldTrends = async (days = 30) => {
  const response = await apiClient.get("/api/v1/analytics/yield-trends", {
    params: { days },
  });
  return response.data;
};

export default {
  login,
  register,
  getCows,
  getCowById,
  createCow,
  updateCow,
  deleteCow,
  getHealthRecords,
  createHealthRecord,
  getMilkYields,
  createMilkYield,
  getAnalyticsSummary,
  getYieldTrends,
};
