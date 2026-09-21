import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to add Auth Token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const login = async (credentials) => {
  const response = await api.post("/api/v1/auth/login", credentials);
  if (response.data?.token) {
    localStorage.setItem("token", response.data.token);
  }
  return response.data;
};

// Inmate Intake API
export const createInmate = async (inmateData) => {
  const response = await api.post("/api/v1/inmates", inmateData);
  return response.data;
};

export const getInmates = async (params = {}) => {
  const response = await api.get("/api/v1/inmates", { params });
  return response.data;
};

export const getInmateById = async (id) => {
  const response = await api.get(`/api/v1/inmates/${id}`);
  return response.data;
};

// Housing API
export const getHousingUnits = async () => {
  const response = await api.get("/api/v1/housing/units");
  return response.data;
};

export const assignHousingCell = async (assignmentData) => {
  const response = await api.post("/api/v1/housing/assign", assignmentData);
  return response.data;
};

export const createKeepAwayRule = async (ruleData) => {
  const response = await api.post("/api/v1/housing/keep-away", ruleData);
  return response.data;
};

// Movements API
export const dispatchMovement = async (movementData) => {
  const response = await api.post("/api/v1/movements", movementData);
  return response.data;
};

export const completeMovement = async (movementId) => {
  const response = await api.put(`/api/v1/movements/${movementId}/complete`);
  return response.data;
};

export const getActiveMovements = async () => {
  const response = await api.get("/api/v1/movements/active");
  return response.data;
};

export const getHeadcount = async () => {
  const response = await api.get("/api/v1/movements/headcount");
  return response.data;
};

// Release API
export const checkReleaseEligibility = async (inmateId) => {
  const response = await api.post(
    `/api/v1/releases/check-eligibility/${inmateId}`,
  );
  return response.data;
};

export const authorizeRelease = async (releaseData) => {
  const response = await api.post("/api/v1/releases/authorize", releaseData);
  return response.data;
};

// Audit API
export const getAuditLogs = async (params = {}) => {
  const response = await api.get("/api/v1/audit/logs", { params });
  return response.data;
};

export default api;
