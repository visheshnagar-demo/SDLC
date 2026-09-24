import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getReleases = async (params = {}) => {
  const response = await apiClient.get("/api/v1/releases", { params });
  return response.data;
};

export const getRelease = async (releaseId) => {
  const response = await apiClient.get(`/api/v1/releases/${releaseId}`);
  return response.data;
};

export const createRelease = async (data) => {
  const response = await apiClient.post("/api/v1/releases", data);
  return response.data;
};

export const updateRelease = async (releaseId, data) => {
  const response = await apiClient.put(`/api/v1/releases/${releaseId}`, data);
  return response.data;
};

export const deleteRelease = async (releaseId) => {
  const response = await apiClient.delete(`/api/v1/releases/${releaseId}`);
  return response.data;
};

export const getReleaseItems = async (releaseId) => {
  const response = await apiClient.get(`/api/v1/releases/${releaseId}/items`);
  return response.data;
};

export const addReleaseItem = async (releaseId, itemData) => {
  const response = await apiClient.post(
    `/api/v1/releases/${releaseId}/items`,
    itemData,
  );
  return response.data;
};

export const updateReleaseItem = async (releaseId, itemId, itemData) => {
  const response = await apiClient.put(
    `/api/v1/releases/${releaseId}/items/${itemId}`,
    itemData,
  );
  return response.data;
};

export const deleteReleaseItem = async (releaseId, itemId) => {
  const response = await apiClient.delete(
    `/api/v1/releases/${releaseId}/items/${itemId}`,
  );
  return response.data;
};

export const getReleaseReadiness = async (releaseId) => {
  const response = await apiClient.get(
    `/api/v1/releases/${releaseId}/readiness`,
  );
  return response.data;
};

export const getDeployments = async (releaseId) => {
  const response = await apiClient.get(
    `/api/v1/releases/${releaseId}/deployments`,
  );
  return response.data;
};

export const createDeployment = async (releaseId, deploymentData) => {
  const response = await apiClient.post(
    `/api/v1/releases/${releaseId}/deployments`,
    deploymentData,
  );
  return response.data;
};

export const getAuditLogs = async (releaseId) => {
  const response = await apiClient.get(
    `/api/v1/releases/${releaseId}/audit-logs`,
  );
  return response.data;
};

export default {
  apiClient,
  getReleases,
  getRelease,
  createRelease,
  updateRelease,
  deleteRelease,
  getReleaseItems,
  addReleaseItem,
  updateReleaseItem,
  deleteReleaseItem,
  getReleaseReadiness,
  getDeployments,
  createDeployment,
  getAuditLogs,
};
