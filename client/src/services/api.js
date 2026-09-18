import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Devotees API
export const getDevotees = async (params = {}) => {
  const response = await api.get("/api/v1/devotees", { params });
  return response.data;
};

export const getDevoteeById = async (id) => {
  const response = await api.get(`/api/v1/devotees/${id}`);
  return response.data;
};

export const createDevotee = async (devoteeData) => {
  const response = await api.post("/api/v1/devotees", devoteeData);
  return response.data;
};

export const addFamilyMember = async (devoteeId, familyData) => {
  const response = await api.post(
    `/api/v1/devotees/${devoteeId}/family`,
    familyData,
  );
  return response.data;
};

// Poojas & Bookings API
export const getPoojas = async () => {
  const response = await api.get("/api/v1/poojas");
  return response.data;
};

export const getPoojaSlots = async (poojaId, params = {}) => {
  const response = await api.get(`/api/v1/poojas/${poojaId}/slots`, { params });
  return response.data;
};

export const createBooking = async (bookingData) => {
  const response = await api.post("/api/v1/bookings", bookingData);
  return response.data;
};

export const getBookingById = async (id) => {
  const response = await api.get(`/api/v1/bookings/${id}`);
  return response.data;
};

export const verifyQRPass = async (id) => {
  const response = await api.post(`/api/v1/bookings/${id}/verify-qr`);
  return response.data;
};

// Donations API
export const getDonations = async (params = {}) => {
  const response = await api.get("/api/v1/donations", { params });
  return response.data;
};

export const getDonationById = async (id) => {
  const response = await api.get(`/api/v1/donations/${id}`);
  return response.data;
};

export const createDonation = async (donationData) => {
  const response = await api.post("/api/v1/donations", donationData);
  return response.data;
};

// Inventory API
export const getInventoryItems = async () => {
  const response = await api.get("/api/v1/inventory/items");
  return response.data;
};

export const recordStockMovement = async (movementData) => {
  const response = await api.post("/api/v1/inventory/movements", movementData);
  return response.data;
};

export const getInventoryAlerts = async () => {
  const response = await api.get("/api/v1/inventory/alerts");
  return response.data;
};

// Finance & Shifts API
export const openCashierShift = async (shiftData) => {
  const response = await api.post("/api/v1/finance/shifts/open", shiftData);
  return response.data;
};

export const closeCashierShift = async (shiftId, shiftData) => {
  const response = await api.post(
    `/api/v1/finance/shifts/${shiftId}/close`,
    shiftData,
  );
  return response.data;
};

export const getDailyRevenueReport = async () => {
  const response = await api.get("/api/v1/finance/reports/daily");
  return response.data;
};

export const getAuditLogs = async (params = {}) => {
  const response = await api.get("/api/v1/finance/audit-logs", { params });
  return response.data;
};

export default api;
