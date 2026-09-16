import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getHealth = async () => {
  const response = await api.get("/api/health");
  return response.data;
};

export const createWire = async (wireData) => {
  const response = await api.post("/api/wires", wireData);
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

export const approveWire = async (wireId, approvedBy) => {
  const response = await api.put(`/api/wires/${wireId}/approve`, {
    approvedBy,
  });
  return response.data;
};

export const rejectWire = async (wireId, approvedBy) => {
  const response = await api.put(`/api/wires/${wireId}/reject`, { approvedBy });
  return response.data;
};

export default api;
