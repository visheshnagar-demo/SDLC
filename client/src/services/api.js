import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.message ||
      "An unexpected network error occurred";
    return Promise.reject(
      new Error(
        typeof message === "object" ? JSON.stringify(message) : message,
      ),
    );
  },
);

// Stock & Inventory
export const getInventory = async (params = {}) => {
  try {
    const response = await apiClient.get("/api/v1/inventory", { params });
    return response.data;
  } catch (err) {
    console.warn("API getInventory fallback/error:", err.message);
    throw err;
  }
};

// Item Catalog
export const getItems = async (params = {}) => {
  try {
    const response = await apiClient.get("/api/v1/items", { params });
    return response.data;
  } catch (err) {
    console.warn("API getItems fallback/error:", err.message);
    throw err;
  }
};

export const createItem = async (payload) => {
  const response = await apiClient.post("/api/v1/items", payload);
  return response.data;
};

export const getItem = async (itemId) => {
  const response = await apiClient.get(`/api/v1/items/${itemId}`);
  return response.data;
};

export const updateItem = async (itemId, payload) => {
  const response = await apiClient.put(`/api/v1/items/${itemId}`, payload);
  return response.data;
};

// Adjustments & Audit Logs
export const adjustStock = async (payload) => {
  const response = await apiClient.post("/api/v1/inventory/adjust", payload);
  return response.data;
};

export const getAuditLogs = async (params = {}) => {
  try {
    const response = await apiClient.get("/api/v1/inventory/audit-logs", {
      params,
    });
    return response.data;
  } catch (err) {
    console.warn("API getAuditLogs error:", err.message);
    throw err;
  }
};

// Low Stock Alerts
export const getAlerts = async () => {
  try {
    const response = await apiClient.get("/api/v1/alerts");
    return response.data;
  } catch (err) {
    console.warn("API getAlerts error:", err.message);
    throw err;
  }
};

// Warehouses
export const getWarehouses = async () => {
  try {
    const response = await apiClient.get("/api/v1/warehouses");
    return response.data;
  } catch (err) {
    console.warn("API getWarehouses error:", err.message);
    throw err;
  }
};

export default {
  apiClient,
  getInventory,
  getItems,
  createItem,
  getItem,
  updateItem,
  adjustStock,
  getAuditLogs,
  getAlerts,
  getWarehouses,
};
