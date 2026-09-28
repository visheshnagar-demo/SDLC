import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const apiClient = axios.create({
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
  login: async (credentials) => {
    const res = await apiClient.post("/api/v1/auth/login", credentials);
    return res.data;
  },
  register: async (userData) => {
    const res = await apiClient.post("/api/v1/auth/register", userData);
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get("/api/v1/auth/me");
    return res.data;
  },
};

export const tracksApi = {
  getTracks: async (params = {}) => {
    const res = await apiClient.get("/api/v1/tracks", { params });
    return res.data;
  },
  getTrackBySlug: async (slug) => {
    const res = await apiClient.get(`/api/v1/tracks/${slug}`);
    return res.data;
  },
};

export const modulesApi = {
  getModuleBySlug: async (slug) => {
    const res = await apiClient.get(`/api/v1/modules/${slug}`);
    return res.data;
  },
};

export const tutorialsApi = {
  getTutorialBySlug: async (slug) => {
    const res = await apiClient.get(`/api/v1/tutorials/${slug}`);
    return res.data;
  },
  searchTutorials: async (query) => {
    const res = await apiClient.get("/api/v1/tutorials/search", {
      params: { q: query },
    });
    return res.data;
  },
};

export const quizzesApi = {
  getQuizByModuleId: async (moduleId) => {
    const res = await apiClient.get(`/api/v1/quizzes/${moduleId}`);
    return res.data;
  },
  submitQuiz: async (quizId, submissionData) => {
    const res = await apiClient.post(
      `/api/v1/quizzes/${quizId}/submit`,
      submissionData,
    );
    return res.data;
  },
};

export const progressApi = {
  getProgress: async () => {
    const res = await apiClient.get("/api/v1/progress");
    return res.data;
  },
  touchModule: async (moduleId) => {
    const res = await apiClient.post(`/api/v1/progress/${moduleId}/touch`);
    return res.data;
  },
};

export const bookmarksApi = {
  getBookmarks: async () => {
    const res = await apiClient.get("/api/v1/bookmarks");
    return res.data;
  },
  addBookmark: async (tutorialId) => {
    const res = await apiClient.post(`/api/v1/bookmarks/${tutorialId}`);
    return res.data;
  },
  removeBookmark: async (tutorialId) => {
    const res = await apiClient.delete(`/api/v1/bookmarks/${tutorialId}`);
    return res.data;
  },
};

export default apiClient;
