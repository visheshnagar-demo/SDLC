import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getTanks = async () => {
  const response = await apiClient.get("/api/v1/tanks");
  return response.data;
};

export const createTank = async (data) => {
  const response = await apiClient.post("/api/v1/tanks", data);
  return response.data;
};

export const ingestTelemetry = async (data) => {
  const response = await apiClient.post("/api/v1/telemetry", data);
  return response.data;
};

export const getTelemetryHistory = async (params = {}) => {
  const response = await apiClient.get("/api/v1/telemetry", { params });
  return response.data;
};

export const getLatestTelemetry = async (tankId) => {
  const response = await apiClient.get("/api/v1/telemetry/latest", {
    params: tankId ? { tank_id: tankId } : {},
  });
  return response.data;
};

export const getThresholds = async (params = {}) => {
  const response = await apiClient.get("/api/v1/thresholds", { params });
  return response.data;
};

export const createOrUpdateThreshold = async (data) => {
  const response = await apiClient.post("/api/v1/thresholds", data);
  return response.data;
};

export const getAlerts = async (params = {}) => {
  const response = await apiClient.get("/api/v1/alerts", { params });
  return response.data;
};

export const updateAlertStatus = async (id, status) => {
  const response = await apiClient.patch(`/api/v1/alerts/${id}/status`, {
    status,
  });
  return response.data;
};

export const getFeedingSchedules = async (params = {}) => {
  const response = await apiClient.get("/api/v1/feeding/schedules", { params });
  return response.data;
};

export const createFeedingSchedule = async (data) => {
  const response = await apiClient.post("/api/v1/feeding/schedules", data);
  return response.data;
};

export const getFeedingLogs = async (params = {}) => {
  const response = await apiClient.get("/api/v1/feeding/logs", { params });
  return response.data;
};

export const createFeedingLog = async (data) => {
  const response = await apiClient.post("/api/v1/feeding/logs", data);
  return response.data;
};

export const getHealthRecords = async (params = {}) => {
  const response = await apiClient.get("/api/v1/health-records", { params });
  return response.data;
};

export const createHealthRecord = async (data) => {
  const response = await apiClient.post("/api/v1/health-records", data);
  return response.data;
};

export const getEquipment = async (params = {}) => {
  const response = await apiClient.get("/api/v1/equipment", { params });
  return response.data;
};

export const createEquipment = async (data) => {
  const response = await apiClient.post("/api/v1/equipment", data);
  return response.data;
};

export const createMaintenanceLog = async (equipmentId, data) => {
  const response = await apiClient.post(
    `/api/v1/equipment/${equipmentId}/maintenance-logs`,
    data,
  );
  return response.data;
};
