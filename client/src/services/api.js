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
    const token = localStorage.getItem("carepulse_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  },
);

export const authApi = {
  login: async (credentials) => {
    const response = await apiClient.post("/api/v1/auth/login", credentials);
    if (response.data && response.data.access_token) {
      localStorage.setItem("carepulse_token", response.data.access_token);
      if (response.data.user) {
        localStorage.setItem(
          "carepulse_user",
          JSON.stringify(response.data.user),
        );
      }
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem("carepulse_token");
    localStorage.removeItem("carepulse_user");
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem("carepulse_user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },
};

export const patientsApi = {
  list: async (params = {}) => {
    const response = await apiClient.get("/api/v1/patients", { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await apiClient.get(`/api/v1/patients/${id}`);
    return response.data;
  },
  create: async (patientData) => {
    const response = await apiClient.post("/api/v1/patients", patientData);
    return response.data;
  },
  update: async (id, patientData) => {
    const response = await apiClient.put(`/api/v1/patients/${id}`, patientData);
    return response.data;
  },
};

export const doctorsApi = {
  list: async (params = {}) => {
    const response = await apiClient.get("/api/v1/doctors", { params });
    return response.data;
  },
  getAvailability: async (doctorId, date) => {
    const response = await apiClient.get(
      `/api/v1/doctors/${doctorId}/availability`,
      {
        params: { date },
      },
    );
    return response.data;
  },
  saveSchedule: async (doctorId, scheduleData) => {
    const response = await apiClient.post(
      `/api/v1/doctors/${doctorId}/schedules`,
      scheduleData,
    );
    return response.data;
  },
};

export const appointmentsApi = {
  list: async (params = {}) => {
    const response = await apiClient.get("/api/v1/appointments", { params });
    return response.data;
  },
  create: async (appointmentData) => {
    const response = await apiClient.post(
      "/api/v1/appointments",
      appointmentData,
    );
    return response.data;
  },
  updateStatus: async (id, status) => {
    const response = await apiClient.patch(
      `/api/v1/appointments/${id}/status`,
      { status },
    );
    return response.data;
  },
};

export const clinicalApi = {
  getRecords: async (appointmentId) => {
    const response = await apiClient.get(
      `/api/v1/appointments/${appointmentId}/records`,
    );
    return response.data;
  },
  createRecord: async (appointmentId, recordData) => {
    const response = await apiClient.post(
      `/api/v1/appointments/${appointmentId}/records`,
      recordData,
    );
    return response.data;
  },
};

export default {
  auth: authApi,
  patients: patientsApi,
  doctors: doctorsApi,
  appointments: appointmentsApi,
  clinical: clinicalApi,
};
