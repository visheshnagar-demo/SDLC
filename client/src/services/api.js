import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("nutrikids_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export const authService = {
  login: async (email, password) => {
    const response = await apiClient.post("/api/v1/auth/login", {
      email,
      password,
    });
    if (response.data && response.data.access_token) {
      localStorage.setItem("nutrikids_token", response.data.access_token);
      localStorage.setItem(
        "nutrikids_user",
        JSON.stringify(response.data.user || { email, role: "parent" }),
      );
    }
    return response.data;
  },
  register: async (email, password, role = "parent") => {
    const response = await apiClient.post("/api/v1/auth/register", {
      email,
      password,
      role,
    });
    if (response.data && response.data.access_token) {
      localStorage.setItem("nutrikids_token", response.data.access_token);
      localStorage.setItem(
        "nutrikids_user",
        JSON.stringify(response.data.user || { email, role }),
      );
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem("nutrikids_token");
    localStorage.removeItem("nutrikids_user");
    localStorage.removeItem("nutrikids_selected_child");
  },
  getStoredUser: () => {
    try {
      const userStr = localStorage.getItem("nutrikids_user");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },
  getStoredToken: () => {
    return localStorage.getItem("nutrikids_token");
  },
};

export const profileService = {
  getChildren: async () => {
    const response = await apiClient.get("/api/v1/profiles");
    return response.data;
  },
  createChild: async (childData) => {
    const response = await apiClient.post("/api/v1/profiles", childData);
    return response.data;
  },
  getSelectedChild: () => {
    try {
      const childStr = localStorage.getItem("nutrikids_selected_child");
      return childStr ? JSON.parse(childStr) : null;
    } catch {
      return null;
    }
  },
  setSelectedChild: (child) => {
    localStorage.setItem("nutrikids_selected_child", JSON.stringify(child));
  },
};

export const mealService = {
  logMeal: async (mealData) => {
    const response = await apiClient.post("/api/v1/meals", mealData);
    return response.data;
  },
  getMeals: async (childId, date = null) => {
    const params = {};
    if (childId) params.child_id = childId;
    if (date) params.date = date;
    const response = await apiClient.get("/api/v1/meals", { params });
    return response.data;
  },
};

export const dashboardService = {
  getWeeklyDashboard: async (childId) => {
    const params = {};
    if (childId) params.child_id = childId;
    const response = await apiClient.get("/api/v1/dashboard/weekly", {
      params,
    });
    return response.data;
  },
};

export const rewardService = {
  getBadges: async (childId) => {
    const params = {};
    if (childId) params.child_id = childId;
    const response = await apiClient.get("/api/v1/rewards/badges", { params });
    return response.data;
  },
  getStreak: async (childId) => {
    const params = {};
    if (childId) params.child_id = childId;
    const response = await apiClient.get("/api/v1/rewards/streak", { params });
    return response.data;
  },
};

export const quizService = {
  getDailyQuiz: async () => {
    const response = await apiClient.get("/api/v1/quizzes/daily");
    return response.data;
  },
  submitQuiz: async (data) => {
    const response = await apiClient.post("/api/v1/quizzes/submit", data);
    return response.data;
  },
};

export const avatarService = {
  getCatalog: async (childId) => {
    const params = {};
    if (childId) params.child_id = childId;
    const response = await apiClient.get("/api/v1/avatars/catalog", { params });
    return response.data;
  },
  unlockAvatar: async (data) => {
    const response = await apiClient.post("/api/v1/avatars/unlock", data);
    return response.data;
  },
  equipAvatar: async (data) => {
    const response = await apiClient.put("/api/v1/avatars/equip", data);
    return response.data;
  },
};

export default {
  authService,
  profileService,
  mealService,
  dashboardService,
  rewardService,
  quizService,
  avatarService,
};
