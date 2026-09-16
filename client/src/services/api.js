import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const setAuthUserHeader = (userId) => {
  if (userId) {
    api.defaults.headers.common["X-User-ID"] = userId;
  } else {
    delete api.defaults.headers.common["X-User-ID"];
  }
};

export const createWire = async (wireData, userId) => {
  const headers = userId ? { "X-User-ID": userId } : {};
  const response = await api.post("/api/wires", wireData, { headers });
  return response.data;
};

export const getPendingWires = async () => {
  const response = await api.get("/api/wires/pending");
  return response.data;
};

export const approveWire = async (wireId, userId) => {
  const headers = userId ? { "X-User-ID": userId } : {};
  const response = await api.put(
    `/api/wires/${wireId}/approve`,
    {},
    { headers },
  );
  return response.data;
};

export const rejectWire = async (wireId, userId) => {
  const headers = userId ? { "X-User-ID": userId } : {};
  const response = await api.put(
    `/api/wires/${wireId}/reject`,
    {},
    { headers },
  );
  return response.data;
};

export default api;
