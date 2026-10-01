import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request interceptor for attaching auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Optional: handle token expiration
    }
    return Promise.reject(error);
  },
);

// Auth APIs
export const authApi = {
  login: async (credentials) => {
    // Support JSON or FormData login
    try {
      const res = await api.post("/api/v1/auth/login", credentials);
      return res.data;
    } catch (err) {
      // Fallback form data payload if backend uses OAuth2PasswordRequestForm
      const formData = new URLSearchParams();
      formData.append("username", credentials.username || credentials.email);
      formData.append("password", credentials.password);
      const res = await api.post("/api/v1/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      return res.data;
    }
  },
  register: async (userData) => {
    const res = await api.post("/api/v1/auth/register", userData);
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await api.get("/api/v1/auth/me");
    return res.data;
  },
};

// Patient APIs
export const patientApi = {
  getPatients: async (params = {}) => {
    const res = await api.get("/api/v1/patients", { params });
    return res.data;
  },
  getPatientById: async (id) => {
    const res = await api.get(`/api/v1/patients/${id}`);
    return res.data;
  },
  createPatient: async (patientData) => {
    const res = await api.post("/api/v1/patients", patientData);
    return res.data;
  },
  updatePatient: async (id, patientData) => {
    const res = await api.put(`/api/v1/patients/${id}`, patientData);
    return res.data;
  },
};

// Appointment APIs
export const appointmentApi = {
  getAppointments: async (params = {}) => {
    const res = await api.get("/api/v1/appointments", { params });
    return res.data;
  },
  getAppointmentById: async (id) => {
    const res = await api.get(`/api/v1/appointments/${id}`);
    return res.data;
  },
  createAppointment: async (appointmentData) => {
    const res = await api.post("/api/v1/appointments", appointmentData);
    return res.data;
  },
  updateAppointmentStatus: async (id, status) => {
    const res = await api.patch(`/api/v1/appointments/${id}/status`, {
      status,
    });
    return res.data;
  },
  getDoctorAvailability: async (doctorId, date) => {
    const res = await api.get(
      `/api/v1/appointments/doctors/${doctorId}/availability`,
      { params: { date } },
    );
    return res.data;
  },
};

// Medical Records / EMR APIs
export const emrApi = {
  getEncounters: async (patientId) => {
    const res = await api.get(
      `/api/v1/medical-records/encounters/${patientId}`,
    );
    return res.data;
  },
  createEncounter: async (encounterData) => {
    const res = await api.post(
      "/api/v1/medical-records/encounters",
      encounterData,
    );
    return res.data;
  },
  createClinicalNote: async (noteData) => {
    const res = await api.post("/api/v1/medical-records/notes", noteData);
    return res.data;
  },
  addNoteAddendum: async (noteId, addendumData) => {
    const res = await api.post(
      `/api/v1/medical-records/notes/${noteId}/addendums`,
      addendumData,
    );
    return res.data;
  },
  createPrescription: async (prescriptionData) => {
    const res = await api.post(
      "/api/v1/medical-records/prescriptions",
      prescriptionData,
    );
    return res.data;
  },
};

// Audit Logs APIs
export const auditApi = {
  getAuditLogs: async (params = {}) => {
    try {
      const res = await api.get("/api/v1/audit/logs", { params });
      return res.data;
    } catch (err) {
      // Fallback endpoint if mapped as /api/v1/audit-logs
      const res = await api.get("/api/v1/audit-logs", { params });
      return res.data;
    }
  },
};

export default api;
