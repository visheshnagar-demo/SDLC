import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("garba_auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const loginUser = async (credentials) => {
  const response = await apiClient.post("/api/v1/auth/login", credentials);
  if (response.data?.token) {
    localStorage.setItem("garba_auth_token", response.data.token);
  }
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await apiClient.post("/api/v1/auth/register", userData);
  return response.data;
};

// Events & Pass Tiers
export const getEvents = async () => {
  const response = await apiClient.get("/api/v1/events");
  return response.data;
};

export const getEventTiers = async (eventId) => {
  const response = await apiClient.get(`/api/v1/events/${eventId}/tiers`);
  return response.data;
};

// Bookings & Passes
export const createBooking = async (bookingData) => {
  const response = await apiClient.post("/api/v1/bookings", bookingData);
  return response.data;
};

export const getPass = async (passId) => {
  const response = await apiClient.get(`/api/v1/passes/${passId}`);
  return response.data;
};

export const getUserPasses = async () => {
  const response = await apiClient.get("/api/v1/passes");
  return response.data;
};

// Gate Validation
export const validateGatePass = async (scanPayload) => {
  const response = await apiClient.post("/api/v1/gates/validate", scanPayload);
  return response.data;
};

// Admin Endpoints
export const getLiveAnalytics = async () => {
  const response = await apiClient.get("/api/v1/admin/analytics/live");
  return response.data;
};

export const updatePassTier = async (tierId, tierData) => {
  const response = await apiClient.put(
    `/api/v1/admin/pass-tiers/${tierId}`,
    tierData,
  );
  return response.data;
};

export const exportAttendees = async () => {
  const response = await apiClient.get("/api/v1/admin/attendees/export", {
    responseType: "blob",
  });
  return response.data;
};

export default {
  loginUser,
  registerUser,
  getEvents,
  getEventTiers,
  createBooking,
  getPass,
  getUserPasses,
  validateGatePass,
  getLiveAnalytics,
  updatePassTier,
  exportAttendees,
};
