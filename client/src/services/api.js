import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (credentials) => {
  const response = await api.post("/api/v1/auth/login", credentials);
  if (response.data?.access_token) {
    localStorage.setItem("token", response.data.access_token);
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("token");
};

export const getMe = async () => {
  const response = await api.get("/api/v1/auth/me");
  return response.data;
};

export const getDevices = async (params = {}) => {
  const response = await api.get("/api/v1/devices", { params });
  return response.data;
};

export const createDevice = async (deviceData) => {
  const response = await api.post("/api/v1/devices", deviceData);
  return response.data;
};

export const getDevice = async (id) => {
  const response = await api.get(`/api/v1/devices/${id}`);
  return response.data;
};

export const updateDevice = async (id, deviceData) => {
  const response = await api.put(`/api/v1/devices/${id}`, deviceData);
  return response.data;
};

export const deleteDevice = async (id) => {
  const response = await api.delete(`/api/v1/devices/${id}`);
  return response.data;
};

export const assignDevice = async (id, assignmentData) => {
  const response = await api.post(
    `/api/v1/devices/${id}/assign`,
    assignmentData,
  );
  return response.data;
};

export const unassignDevice = async (id) => {
  const response = await api.post(`/api/v1/devices/${id}/unassign`);
  return response.data;
};

export const getDeviceAssignments = async (id) => {
  const response = await api.get(`/api/v1/devices/${id}/assignments`);
  return response.data;
};

export const triggerDeviceAction = async (id, actionData) => {
  const response = await api.post(`/api/v1/devices/${id}/actions`, actionData);
  return response.data;
};

export const getUsers = async () => {
  const response = await api.get("/api/v1/users");
  return response.data;
};

export const getPolicies = async () => {
  const response = await api.get("/api/v1/policies");
  return response.data;
};

export const updatePolicy = async (id, policyData) => {
  const response = await api.put(`/api/v1/policies/${id}`, policyData);
  return response.data;
};

export const getDashboardAnalytics = async () => {
  const response = await api.get("/api/v1/analytics/dashboard");
  return response.data;
};

export const getAuditLogs = async (params = {}) => {
  const response = await api.get("/api/v1/audit-logs", { params });
  return response.data;
};

export default api;
