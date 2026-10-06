import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Cattle API
export const getCattle = async (params = {}) => {
  const response = await apiClient.get("/api/v1/cattle", { params });
  return response.data;
};

export const createCattle = async (data) => {
  const response = await apiClient.post("/api/v1/cattle", data);
  return response.data;
};

export const getCowById = async (id) => {
  const response = await apiClient.get(`/api/v1/cattle/${id}`);
  return response.data;
};

export const updateCow = async (id, data) => {
  const response = await apiClient.put(`/api/v1/cattle/${id}`, data);
  return response.data;
};

// Milking API
export const getMilkLogs = async (params = {}) => {
  const response = await apiClient.get("/api/v1/milk-logs", { params });
  return response.data;
};

export const createMilkLog = async (data) => {
  const response = await apiClient.post("/api/v1/milk-logs", data);
  return response.data;
};

export const getMilkSummary = async (params = {}) => {
  const response = await apiClient.get("/api/v1/milk-logs/summary", { params });
  return response.data;
};

// Breeding API
export const getBreedingRecords = async (params = {}) => {
  const response = await apiClient.get("/api/v1/breeding-records", { params });
  return response.data;
};

export const createBreedingRecord = async (data) => {
  const response = await apiClient.post("/api/v1/breeding-records", data);
  return response.data;
};

export const updateBreedingRecord = async (id, data) => {
  const response = await apiClient.put(`/api/v1/breeding-records/${id}`, data);
  return response.data;
};

// Feed API
export const getFeedRations = async (params = {}) => {
  const response = await apiClient.get("/api/v1/feed-rations", { params });
  return response.data;
};

export const createFeedRation = async (data) => {
  const response = await apiClient.post("/api/v1/feed-rations", data);
  return response.data;
};

export const getFeedInventory = async (params = {}) => {
  const response = await apiClient.get("/api/v1/feed-inventory", { params });
  return response.data;
};

export const updateFeedInventory = async (data) => {
  const response = await apiClient.post("/api/v1/feed-inventory", data);
  return response.data;
};

// Health & Veterinary API
export const getHealthRecords = async (params = {}) => {
  const response = await apiClient.get("/api/v1/health-records", { params });
  return response.data;
};

export const createHealthRecord = async (data) => {
  const response = await apiClient.post("/api/v1/health-records", data);
  return response.data;
};

export const getActiveWithdrawals = async () => {
  const response = await apiClient.get(
    "/api/v1/health-records/active-withdrawals",
  );
  return response.data;
};

// Analytics & Dashboard API
export const getDashboardAnalytics = async () => {
  const response = await apiClient.get("/api/v1/analytics/dashboard");
  return response.data;
};
