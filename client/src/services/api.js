import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

/**
 * Fetch all registered monitors
 * @param {Object} [params] - Optional query parameters (e.g. status, search, skip, limit)
 */
export const getMonitors = async (params = {}) => {
  const response = await apiClient.get("/api/v1/monitors", { params });
  return response.data;
};

/**
 * Fetch a single monitor by ID
 * @param {string} monitorId
 */
export const getMonitor = async (monitorId) => {
  const response = await apiClient.get(`/api/v1/monitors/${monitorId}`);
  return response.data;
};

/**
 * Register a new monitor
 * @param {Object} data - { name, url, http_method, check_interval_seconds, expected_status_code, timeout_ms, is_active }
 */
export const createMonitor = async (data) => {
  const response = await apiClient.post("/api/v1/monitors", data);
  return response.data;
};

/**
 * Update monitor configuration
 * @param {string} monitorId
 * @param {Object} data
 */
export const updateMonitor = async (monitorId, data) => {
  const response = await apiClient.put(`/api/v1/monitors/${monitorId}`, data);
  return response.data;
};

/**
 * Delete a registered monitor
 * @param {string} monitorId
 */
export const deleteMonitor = async (monitorId) => {
  const response = await apiClient.delete(`/api/v1/monitors/${monitorId}`);
  return response.data;
};

/**
 * Trigger an immediate on-demand health check probe
 * @param {string} monitorId
 */
export const triggerHealthCheck = async (monitorId) => {
  const response = await apiClient.post(`/api/v1/monitors/${monitorId}/check`);
  return response.data;
};

/**
 * Query historical health check logs
 * @param {Object} [params] - { monitor_id, status, failure_only, skip, limit }
 */
export const getHealthLogs = async (params = {}) => {
  const response = await apiClient.get("/api/v1/health-logs", { params });
  return response.data;
};

/**
 * Query aggregated metrics across time windows
 * @param {Object} [params] - { time_window: '24h' | '7d' | '30d', monitor_id }
 */
export const getMetrics = async (params = {}) => {
  const response = await apiClient.get("/api/v1/health-logs/metrics", {
    params,
  });
  return response.data;
};

export default {
  getMonitors,
  getMonitor,
  createMonitor,
  updateMonitor,
  deleteMonitor,
  triggerHealthCheck,
  getHealthLogs,
  getMetrics,
  apiClient,
};
