import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("carepulse_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication
export const authApi = {
  login: async (credentials) => {
    const response = await apiClient.post("/api/v1/auth/login", credentials);
    if (response.data && response.data.access_token) {
      localStorage.setItem("carepulse_token", response.data.access_token);
    }
    return response.data;
  },
  register: async (userData) => {
    const response = await apiClient.post("/api/v1/auth/register", userData);
    return response.data;
  },
  getMe: async () => {
    const response = await apiClient.get("/api/v1/auth/me");
    return response.data;
  },
  logout: () => {
    localStorage.removeItem("carepulse_token");
  },
};

// Patients
export const patientApi = {
  getPatients: async (params = {}) => {
    const response = await apiClient.get("/api/v1/patients", { params });
    return response.data;
  },
  getPatientById: async (id) => {
    const response = await apiClient.get(`/api/v1/patients/${id}`);
    return response.data;
  },
  createPatient: async (patientData) => {
    const response = await apiClient.post("/api/v1/patients", patientData);
    return response.data;
  },
  updatePatient: async (id, patientData) => {
    const response = await apiClient.put(`/api/v1/patients/${id}`, patientData);
    return response.data;
  },
};

// Appointments
export const appointmentApi = {
  getAppointments: async (params = {}) => {
    const response = await apiClient.get("/api/v1/appointments", { params });
    return response.data;
  },
  bookAppointment: async (appointmentData) => {
    const response = await apiClient.post(
      "/api/v1/appointments",
      appointmentData,
    );
    return response.data;
  },
  updateAppointmentStatus: async (id, status) => {
    const response = await apiClient.put(`/api/v1/appointments/${id}/status`, {
      status,
    });
    return response.data;
  },
};

// EHR & Clinical Encounters
export const ehrApi = {
  getPatientEncounters: async (patientId) => {
    const response = await apiClient.get(
      `/api/v1/ehr/patients/${patientId}/encounters`,
    );
    return response.data;
  },
  getEncounterById: async (id) => {
    const response = await apiClient.get(`/api/v1/ehr/encounters/${id}`);
    return response.data;
  },
  createEncounter: async (encounterData) => {
    const response = await apiClient.post(
      "/api/v1/ehr/encounters",
      encounterData,
    );
    return response.data;
  },
  closeEncounter: async (id) => {
    const response = await apiClient.post(`/api/v1/ehr/encounters/${id}/close`);
    return response.data;
  },
};

// Billing & Invoices
export const billingApi = {
  getInvoices: async (params = {}) => {
    const response = await apiClient.get("/api/v1/billing/invoices", {
      params,
    });
    return response.data;
  },
  getInvoiceById: async (id) => {
    const response = await apiClient.get(`/api/v1/billing/invoices/${id}`);
    return response.data;
  },
  payInvoice: async (id, paymentData) => {
    const response = await apiClient.post(
      `/api/v1/billing/invoices/${id}/pay`,
      paymentData,
    );
    return response.data;
  },
};

export default {
  auth: authApi,
  patients: patientApi,
  appointments: appointmentApi,
  ehr: ehrApi,
  billing: billingApi,
};
