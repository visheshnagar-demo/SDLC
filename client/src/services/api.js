import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const createWire = async (wireData, userId) => {
  const response = await api.post("/api/wires", wireData, {
    headers: {
      "X-User-Id": userId,
    },
  });
  return response.data;
};

export const getPendingWires = async () => {
  const response = await api.get("/api/wires/pending");
  return response.data;
};

export const getAllWires = async () => {
  const response = await api.get("/api/wires");
  return response.data;
};

export const approveWire = async (wireId, userId) => {
  const response = await api.put(`/api/wires/${wireId}/approve`, null, {
    headers: {
      "X-User-Id": userId,
    },
  });
  return response.data;
};

export const rejectWire = async (wireId, userId) => {
  const response = await api.put(`/api/wires/${wireId}/reject`, null, {
    headers: {
      "X-User-Id": userId,
    },
  });
  return response.data;
};

export default api;
