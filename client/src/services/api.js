import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export const authApi = {
  login: async (email, password) => {
    const response = await apiClient.post("/api/v1/auth/login", {
      email,
      password,
    });
    return response.data;
  },
  register: async (email, password, full_name) => {
    const response = await apiClient.post("/api/v1/auth/register", {
      email,
      password,
      full_name,
    });
    return response.data;
  },
};

export const productsApi = {
  getProducts: async (params = {}) => {
    const response = await apiClient.get("/api/v1/products", { params });
    return response.data;
  },
  getProductById: async (id) => {
    const response = await apiClient.get(`/api/v1/products/${id}`);
    return response.data;
  },
  createProduct: async (productData) => {
    const response = await apiClient.post("/api/v1/products", productData);
    return response.data;
  },
  updateProduct: async (id, productData) => {
    const response = await apiClient.put(`/api/v1/products/${id}`, productData);
    return response.data;
  },
  deleteProduct: async (id) => {
    const response = await apiClient.delete(`/api/v1/products/${id}`);
    return response.data;
  },
};

export const warrantiesApi = {
  getWarranties: async (params = {}) => {
    const response = await apiClient.get("/api/v1/warranties", { params });
    return response.data;
  },
  getWarrantyById: async (id) => {
    const response = await apiClient.get(`/api/v1/warranties/${id}`);
    return response.data;
  },
  createWarranty: async (warrantyData) => {
    const response = await apiClient.post("/api/v1/warranties", warrantyData);
    return response.data;
  },
  updateWarranty: async (id, warrantyData) => {
    const response = await apiClient.put(
      `/api/v1/warranties/${id}`,
      warrantyData,
    );
    return response.data;
  },
};

export const documentsApi = {
  uploadDocument: async (formData) => {
    const response = await apiClient.post(
      "/api/v1/documents/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },
  getDocument: async (id) => {
    const response = await apiClient.get(`/api/v1/documents/${id}`);
    return response.data;
  },
  deleteDocument: async (id) => {
    const response = await apiClient.delete(`/api/v1/documents/${id}`);
    return response.data;
  },
};

export const claimsApi = {
  getClaims: async (params = {}) => {
    const response = await apiClient.get("/api/v1/claims", { params });
    return response.data;
  },
  getClaimById: async (id) => {
    const response = await apiClient.get(`/api/v1/claims/${id}`);
    return response.data;
  },
  createClaim: async (claimData) => {
    const response = await apiClient.post("/api/v1/claims", claimData);
    return response.data;
  },
  updateClaim: async (id, claimData) => {
    const response = await apiClient.patch(`/api/v1/claims/${id}`, claimData);
    return response.data;
  },
};

export const alertsApi = {
  getAlerts: async () => {
    const response = await apiClient.get("/api/v1/alerts");
    return response.data;
  },
};

export default {
  auth: authApi,
  products: productsApi,
  warranties: warrantiesApi,
  documents: documentsApi,
  claims: claimsApi,
  alerts: alertsApi,
};
