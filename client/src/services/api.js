import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getInmates = async (params = {}) => {
  const response = await apiClient.get("/api/v1/inmates", { params });
  return response.data;
};

export const createInmate = async (data) => {
  const response = await apiClient.post("/api/v1/inmates", data);
  return response.data;
};

export const getInmateById = async (id) => {
  const response = await apiClient.get(`/api/v1/inmates/${id}`);
  return response.data;
};

export const updateInmate = async (id, data) => {
  const response = await apiClient.put(`/api/v1/inmates/${id}`, data);
  return response.data;
};

export const getCells = async (params = {}) => {
  const response = await apiClient.get("/api/v1/cells", { params });
  return response.data;
};

export const assignCell = async (data) => {
  const response = await apiClient.post("/api/v1/cells/assign", data);
  return response.data;
};

export const getVisitorLogs = async (params = {}) => {
  const response = await apiClient.get("/api/v1/visitors/check-in", { params });
  return response.data;
};

export const checkInVisitor = async (data) => {
  const response = await apiClient.post("/api/v1/visitors/check-in", data);
  return response.data;
};

export const checkOutVisitor = async (id) => {
  const response = await apiClient.post(`/api/v1/visitors/check-out`, {
    visitor_log_id: id,
  });
  return response.data;
};

export const getAuditLogs = async (params = {}) => {
  const response = await apiClient.get("/api/v1/audit-logs", { params });
  return response.data;
};
