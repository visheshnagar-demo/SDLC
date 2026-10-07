import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export const api = {
  // Analytics
  getDashboardAnalytics: async () => {
    const response = await apiClient.get("/api/v1/analytics/dashboard");
    return response.data;
  },

  // Rooms
  getRooms: async (params = {}) => {
    const response = await apiClient.get("/api/v1/rooms", { params });
    return response.data;
  },
  getRoomById: async (id) => {
    const response = await apiClient.get(`/api/v1/rooms/${id}`);
    return response.data;
  },
  createRoom: async (data) => {
    const response = await apiClient.post("/api/v1/rooms", data);
    return response.data;
  },
  updateRoomStatus: async (id, statusData) => {
    const response = await apiClient.patch(
      `/api/v1/rooms/${id}/status`,
      statusData,
    );
    return response.data;
  },
  updateRoom: async (id, data) => {
    const response = await apiClient.patch(`/api/v1/rooms/${id}`, data);
    return response.data;
  },

  // Guests
  getGuests: async (params = {}) => {
    const response = await apiClient.get("/api/v1/guests", { params });
    return response.data;
  },
  getGuestById: async (id) => {
    const response = await apiClient.get(`/api/v1/guests/${id}`);
    return response.data;
  },
  createGuest: async (data) => {
    const response = await apiClient.post("/api/v1/guests", data);
    return response.data;
  },

  // Bookings
  getBookings: async (params = {}) => {
    const response = await apiClient.get("/api/v1/bookings", { params });
    return response.data;
  },
  getBookingById: async (id) => {
    const response = await apiClient.get(`/api/v1/bookings/${id}`);
    return response.data;
  },
  createBooking: async (data) => {
    const response = await apiClient.post("/api/v1/bookings", data);
    return response.data;
  },
  checkInGuest: async (id, data = {}) => {
    const response = await apiClient.post(
      `/api/v1/bookings/${id}/check-in`,
      data,
    );
    return response.data;
  },
  checkOutGuest: async (id, data = {}) => {
    const response = await apiClient.post(
      `/api/v1/bookings/${id}/check-out`,
      data,
    );
    return response.data;
  },

  // Invoices & Billing
  getInvoices: async (params = {}) => {
    const response = await apiClient.get("/api/v1/invoices", { params });
    return response.data;
  },
  getInvoiceById: async (id) => {
    const response = await apiClient.get(`/api/v1/invoices/${id}`);
    return response.data;
  },
  addInvoiceItem: async (id, itemData) => {
    const response = await apiClient.post(
      `/api/v1/invoices/${id}/items`,
      itemData,
    );
    return response.data;
  },
  payInvoice: async (id, paymentData) => {
    const response = await apiClient.post(
      `/api/v1/invoices/${id}/pay`,
      paymentData,
    );
    return response.data;
  },
};

export default apiClient;
