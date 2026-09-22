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
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const token = window.localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (err) {
      console.warn("Could not read auth token from localStorage", err);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export const authApi = {
  login: async (credentials) => {
    try {
      const res = await apiClient.post("/api/v1/auth/login", credentials);
      return res.data;
    } catch (err) {
      if (
        err.response?.status === 422 &&
        credentials.email &&
        credentials.password
      ) {
        const params = new URLSearchParams();
        params.append("username", credentials.email);
        params.append("password", credentials.password);
        const formRes = await apiClient.post("/api/v1/auth/login", params, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        return formRes.data;
      }
      throw err;
    }
  },

  register: async (data) => {
    const res = await apiClient.post("/api/v1/auth/register", data);
    return res.data;
  },

  getProfile: async () => {
    const res = await apiClient.get("/api/v1/auth/me");
    return res.data;
  },
};

export const watchesApi = {
  getWatches: async (params = {}) => {
    const res = await apiClient.get("/api/v1/watches", { params });
    return res.data;
  },

  getWatchById: async (id) => {
    const res = await apiClient.get(`/api/v1/watches/${id}`);
    return res.data;
  },

  createWatch: async (data) => {
    const res = await apiClient.post("/api/v1/watches", data);
    return res.data;
  },
};

export const cartApi = {
  reserveWatch: async (watchId) => {
    const res = await apiClient.post("/api/v1/cart/reserve", {
      watch_id: watchId,
    });
    return res.data;
  },

  releaseReservation: async (watchId) => {
    const res = await apiClient.delete(`/api/v1/cart/reserve/${watchId}`);
    return res.data;
  },
};

export const ordersApi = {
  checkout: async (checkoutPayload) => {
    const res = await apiClient.post(
      "/api/v1/orders/checkout",
      checkoutPayload,
    );
    return res.data;
  },

  getOrders: async () => {
    const res = await apiClient.get("/api/v1/orders");
    return res.data;
  },

  getOrderById: async (id) => {
    const res = await apiClient.get(`/api/v1/orders/${id}`);
    return res.data;
  },

  updateOrderStatus: async (id, statusPayload) => {
    const res = await apiClient.patch(
      `/api/v1/orders/${id}/status`,
      statusPayload,
    );
    return res.data;
  },
};

export const wishlistApi = {
  getWishlist: async () => {
    const res = await apiClient.get("/api/v1/wishlist");
    return res.data;
  },

  toggleWishlist: async (watchId) => {
    const res = await apiClient.post(`/api/v1/wishlist/${watchId}`);
    return res.data;
  },
};

export default apiClient;
