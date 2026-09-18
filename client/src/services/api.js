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

// Flowers API
export const getFlowers = async (params = {}) => {
  try {
    const response = await apiClient.get("/api/v1/flowers", { params });
    return response.data;
  } catch (err) {
    console.warn("getFlowers fallback trigger:", err.message);
    return [];
  }
};

export const getFlower = async (id) => {
  const response = await apiClient.get(`/api/v1/flowers/${id}`);
  return response.data;
};

export const createFlower = async (payload) => {
  const response = await apiClient.post("/api/v1/flowers", payload);
  return response.data;
};

export const updateFlower = async (id, payload) => {
  const response = await apiClient.put(`/api/v1/flowers/${id}`, payload);
  return response.data;
};

export const deleteFlower = async (id) => {
  const response = await apiClient.delete(`/api/v1/flowers/${id}`);
  return response.data;
};

// Orders API
export const getOrders = async (params = {}) => {
  try {
    const response = await apiClient.get("/api/v1/orders", { params });
    return response.data;
  } catch (err) {
    console.warn("getOrders fallback trigger:", err.message);
    return [];
  }
};

export const getOrder = async (id) => {
  const response = await apiClient.get(`/api/v1/orders/${id}`);
  return response.data;
};

export const createOrder = async (payload) => {
  const response = await apiClient.post("/api/v1/orders", payload);
  return response.data;
};

export const updateOrderStatus = async (id, status) => {
  const response = await apiClient.patch(`/api/v1/orders/${id}/status`, {
    status,
  });
  return response.data;
};

// Suppliers API
export const getSuppliers = async (params = {}) => {
  try {
    const response = await apiClient.get("/api/v1/suppliers", { params });
    return response.data;
  } catch (err) {
    console.warn("getSuppliers fallback trigger:", err.message);
    return [];
  }
};

export const getSupplier = async (id) => {
  const response = await apiClient.get(`/api/v1/suppliers/${id}`);
  return response.data;
};

export const createSupplier = async (payload) => {
  const response = await apiClient.post("/api/v1/suppliers", payload);
  return response.data;
};

export const updateSupplier = async (id, payload) => {
  const response = await apiClient.put(`/api/v1/suppliers/${id}`, payload);
  return response.data;
};

export const deleteSupplier = async (id) => {
  const response = await apiClient.delete(`/api/v1/suppliers/${id}`);
  return response.data;
};

// Categories API
export const getCategories = async (params = {}) => {
  try {
    const response = await apiClient.get("/api/v1/categories", { params });
    return response.data;
  } catch (err) {
    console.warn("getCategories fallback trigger:", err.message);
    return [];
  }
};

export const createCategory = async (payload) => {
  const response = await apiClient.post("/api/v1/categories", payload);
  return response.data;
};

// Analytics Dashboard API
export const getDashboardAnalytics = async () => {
  try {
    const response = await apiClient.get("/api/v1/analytics/dashboard");
    return response.data;
  } catch (err) {
    console.warn("getDashboardAnalytics fallback trigger:", err.message);
    return {
      total_revenue: 0,
      total_orders: 0,
      total_flowers_in_stock: 0,
      low_stock_count: 0,
      top_selling_flowers: [],
    };
  }
};

export default {
  apiClient,
  getFlowers,
  getFlower,
  createFlower,
  updateFlower,
  deleteFlower,
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getCategories,
  createCategory,
  getDashboardAnalytics,
};
