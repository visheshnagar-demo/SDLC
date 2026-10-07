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
  login: async (credentials) => {
    const response = await apiClient.post("/api/v1/auth/login", credentials);
    return response.data;
  },
  register: async (userData) => {
    const response = await apiClient.post("/api/v1/auth/register", userData);
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await apiClient.get("/api/v1/auth/me");
    return response.data;
  },
};

export const patientsApi = {
  getPatients: async (params = {}) => {
    const response = await apiClient.get("/api/v1/patients", { params });
    return response.data;
  },
  getPatientById: async (patientId) => {
    const response = await apiClient.get(`/api/v1/patients/${patientId}`);
    return response.data;
  },
  createPatient: async (patientData) => {
    const response = await apiClient.post("/api/v1/patients", patientData);
    return response.data;
  },
};

export const doctorsApi = {
  getDoctors: async (params = {}) => {
    const response = await apiClient.get("/api/v1/doctors", { params });
    return response.data;
  },
};

export const appointmentsApi = {
  getSlots: async (params = {}) => {
    const response = await apiClient.get("/api/v1/appointments/slots", {
      params,
    });
    return response.data;
  },
  bookAppointment: async (appointmentData) => {
    const response = await apiClient.post(
      "/api/v1/appointments",
      appointmentData,
    );
    return response.data;
  },
  getAppointments: async (params = {}) => {
    const response = await apiClient.get("/api/v1/appointments", { params });
    return response.data;
  },
  updateStatus: async (appointmentId, status) => {
    const response = await apiClient.patch(
      `/api/v1/appointments/${appointmentId}/status`,
      { status },
    );
    return response.data;
  },
};

export const ehrApi = {
  createRecord: async (recordData) => {
    const response = await apiClient.post("/api/v1/ehr/records", recordData);
    return response.data;
  },
  getPatientRecords: async (patientId) => {
    const response = await apiClient.get(`/api/v1/ehr/patients/${patientId}`);
    return response.data;
  },
  downloadPrescription: async (recordId) => {
    const response = await apiClient.get(
      `/api/v1/ehr/records/${recordId}/download-prescription`,
    );
    return response.data;
  },
};

export const auditApi = {
  getLogs: async (params = {}) => {
    const response = await apiClient.get("/api/v1/audit/logs", { params });
    return response.data;
  },
};

export default {
  auth: authApi,
  patients: patientsApi,
  doctors: doctorsApi,
  appointments: appointmentsApi,
  ehr: ehrApi,
  audit: auditApi,
};
