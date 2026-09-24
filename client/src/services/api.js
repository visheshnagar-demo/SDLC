import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Artifacts API
export const getArtifacts = async (params = {}) => {
  const response = await apiClient.get("/api/v1/artifacts", { params });
  return response.data;
};

export const getArtifactById = async (id) => {
  const response = await apiClient.get(`/api/v1/artifacts/${id}`);
  return response.data;
};

export const createArtifact = async (data) => {
  const response = await apiClient.post("/api/v1/artifacts", data);
  return response.data;
};

export const updateArtifact = async (id, data) => {
  const response = await apiClient.put(`/api/v1/artifacts/${id}`, data);
  return response.data;
};

export const deleteArtifact = async (id) => {
  const response = await apiClient.delete(`/api/v1/artifacts/${id}`);
  return response.data;
};

// Locations API
export const getLocations = async (params = {}) => {
  const response = await apiClient.get("/api/v1/locations", { params });
  return response.data;
};

export const createLocation = async (data) => {
  const response = await apiClient.post("/api/v1/locations", data);
  return response.data;
};

// Restorations API
export const getRestorations = async (params = {}) => {
  const response = await apiClient.get("/api/v1/restorations", { params });
  return response.data;
};

export const createRestoration = async (data) => {
  const response = await apiClient.post("/api/v1/restorations", data);
  return response.data;
};

// Environmental Telemetry API
export const getEnvironmentalReadings = async (params = {}) => {
  const response = await apiClient.get("/api/v1/environmental-readings", {
    params,
  });
  return response.data;
};

export const createEnvironmentalReading = async (data) => {
  const response = await apiClient.post("/api/v1/environmental-readings", data);
  return response.data;
};

// Inspections API
export const getInspections = async (params = {}) => {
  const response = await apiClient.get("/api/v1/inspections", { params });
  return response.data;
};

export const createInspection = async (data) => {
  const response = await apiClient.post("/api/v1/inspections", data);
  return response.data;
};

export const completeInspection = async (id, data) => {
  const response = await apiClient.put(
    `/api/v1/inspections/${id}/complete`,
    data,
  );
  return response.data;
};

// Loans API
export const getLoans = async (params = {}) => {
  const response = await apiClient.get("/api/v1/loans", { params });
  return response.data;
};

export const createLoan = async (data) => {
  const response = await apiClient.post("/api/v1/loans", data);
  return response.data;
};

export const updateLoanStatus = async (id, data) => {
  const response = await apiClient.put(`/api/v1/loans/${id}/status`, data);
  return response.data;
};

export default {
  getArtifacts,
  getArtifactById,
  createArtifact,
  updateArtifact,
  deleteArtifact,
  getLocations,
  createLocation,
  getRestorations,
  createRestoration,
  getEnvironmentalReadings,
  createEnvironmentalReading,
  getInspections,
  createInspection,
  completeInspection,
  getLoans,
  createLoan,
  updateLoanStatus,
};
