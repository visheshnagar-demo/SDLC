import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const createWireTransfer = async (wireData) => {
  const response = await apiClient.post("/api/wires", wireData);
  return response.data;
};

export const getPendingWires = async () => {
  const response = await apiClient.get("/api/wires/pending");
  return response.data;
};

export const approveWireTransfer = async (wireId, approvedBy) => {
  const response = await apiClient.put(`/api/wires/${wireId}/approve`, {
    approvedBy,
  });
  return response.data;
};

export const rejectWireTransfer = async (wireId, approvedBy) => {
  const response = await apiClient.put(`/api/wires/${wireId}/reject`, {
    approvedBy,
  });
  return response.data;
};

export default apiClient;
