import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (credentials) => {
    const response = await api.post("/api/v1/auth/login", credentials);
    if (response.data?.access_token) {
      localStorage.setItem("token", response.data.access_token);
    }
    return response.data;
  },
  getMe: async () => {
    const response = await api.get("/api/v1/auth/me");
    return response.data;
  },
  logout: () => {
    localStorage.removeItem("token");
  },
};

export const dashboardApi = {
  getMetrics: async () => {
    const response = await api.get("/api/v1/dashboard/metrics");
    return response.data;
  },
};

export const channelsApi = {
  getChannels: async (params) => {
    const response = await api.get("/api/v1/channels", { params });
    return response.data;
  },
  getChannelById: async (id) => {
    const response = await api.get(`/api/v1/channels/${id}`);
    return response.data;
  },
  createChannel: async (data) => {
    const response = await api.post("/api/v1/channels", data);
    return response.data;
  },
  updateChannel: async (id, data) => {
    const response = await api.put(`/api/v1/channels/${id}`, data);
    return response.data;
  },
  deleteChannel: async (id) => {
    const response = await api.delete(`/api/v1/channels/${id}`);
    return response.data;
  },
};

export const programsApi = {
  getPrograms: async (params) => {
    const response = await api.get("/api/v1/programs", { params });
    return response.data;
  },
  getProgramById: async (id) => {
    const response = await api.get(`/api/v1/programs/${id}`);
    return response.data;
  },
  createProgram: async (data) => {
    const response = await api.post("/api/v1/programs", data);
    return response.data;
  },
  updateProgram: async (id, data) => {
    const response = await api.put(`/api/v1/programs/${id}`, data);
    return response.data;
  },
  deleteProgram: async (id) => {
    const response = await api.delete(`/api/v1/programs/${id}`);
    return response.data;
  },
};

export const schedulesApi = {
  getSchedules: async (params) => {
    const response = await api.get("/api/v1/schedules", { params });
    return response.data;
  },
  getLiveSchedules: async () => {
    const response = await api.get("/api/v1/schedules/live");
    return response.data;
  },
  createSchedule: async (data) => {
    const response = await api.post("/api/v1/schedules", data);
    return response.data;
  },
  updateSchedule: async (id, data) => {
    const response = await api.put(`/api/v1/schedules/${id}`, data);
    return response.data;
  },
  deleteSchedule: async (id) => {
    const response = await api.delete(`/api/v1/schedules/${id}`);
    return response.data;
  },
  triggerOverride: async (idOrData, payload) => {
    if (typeof idOrData === "string") {
      const response = await api.post(
        `/api/v1/schedules/${idOrData}/override`,
        payload,
      );
      return response.data;
    }
    const response = await api.post("/api/v1/schedules/override", idOrData);
    return response.data;
  },
};

export const articlesApi = {
  getArticles: async (params) => {
    const response = await api.get("/api/v1/articles", { params });
    return response.data;
  },
  getArticleById: async (id) => {
    const response = await api.get(`/api/v1/articles/${id}`);
    return response.data;
  },
  createArticle: async (data) => {
    const response = await api.post("/api/v1/articles", data);
    return response.data;
  },
  updateArticle: async (id, data) => {
    const response = await api.put(`/api/v1/articles/${id}`, data);
    return response.data;
  },
  updateStatus: async (id, data) => {
    const response = await api.patch(`/api/v1/articles/${id}/status`, data);
    return response.data;
  },
  deleteArticle: async (id) => {
    const response = await api.delete(`/api/v1/articles/${id}`);
    return response.data;
  },
};

export default api;
