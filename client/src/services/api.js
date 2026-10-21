import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token from localStorage if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("garba_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Authentication
export const registerUser = async (userData) => {
  const response = await apiClient.post("/api/v1/auth/register", userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await apiClient.post("/api/v1/auth/login", credentials);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get("/api/v1/auth/me");
  return response.data;
};

// Events & Pass Tiers
export const getEvents = async () => {
  const response = await apiClient.get("/api/v1/events");
  return response.data;
};

export const getEventById = async (eventId) => {
  const response = await apiClient.get(`/api/v1/events/${eventId}`);
  return response.data;
};

export const getEventTiers = async (eventId) => {
  const response = await apiClient.get(`/api/v1/events/${eventId}/tiers`);
  return response.data;
};

// Bookings
export const createBooking = async (bookingData) => {
  const response = await apiClient.post("/api/v1/bookings", bookingData);
  return response.data;
};

export const getBookingById = async (bookingId) => {
  const response = await apiClient.get(`/api/v1/bookings/${bookingId}`);
  return response.data;
};

// Passes
export const getMyPasses = async () => {
  const response = await apiClient.get("/api/v1/passes/my-passes");
  return response.data;
};

export const getPassById = async (passId) => {
  const response = await apiClient.get(`/api/v1/passes/${passId}`);
  return response.data;
};

export const listAllPasses = async (skip = 0, limit = 50) => {
  const response = await apiClient.get(
    `/api/v1/passes?skip=${skip}&limit=${limit}`,
  );
  return response.data;
};

// Gate Validation
export const validateGatePass = async (scanPayload) => {
  const response = await apiClient.post("/api/v1/gates/validate", scanPayload);
  return response.data;
};

// Admin
export const getLiveAnalytics = async () => {
  const response = await apiClient.get("/api/v1/admin/analytics/live");
  return response.data;
};

export const updatePassTier = async (tierId, updateData) => {
  const response = await apiClient.put(
    `/api/v1/admin/pass-tiers/${tierId}`,
    updateData,
  );
  return response.data;
};

export const exportAttendeesCsv = async () => {
  const response = await apiClient.get("/api/v1/admin/attendees/export", {
    responseType: "blob",
  });
  return response.data;
};

export default apiClient;
