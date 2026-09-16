import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export const createWire = async (wireData) => {
  try {
    const response = await apiClient.post("/api/wires", wireData);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response;
    }
    throw new Error("Network error: Unable to connect to backend service.");
  }
};

export const getPendingWires = async () => {
  try {
    const response = await apiClient.get("/api/wires/pending");
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response;
    }
    throw new Error("Network error: Unable to fetch pending wires.");
  }
};

export const getAllWires = async () => {
  try {
    const response = await apiClient.get("/api/wires");
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response;
    }
    throw new Error("Network error: Unable to fetch all wires.");
  }
};

export const approveWire = async (wireId, approvedBy) => {
  try {
    const response = await apiClient.put(`/api/wires/${wireId}/approve`, {
      approvedBy,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response;
    }
    throw new Error("Network error: Unable to process wire approval.");
  }
};

export const rejectWire = async (wireId, approvedBy) => {
  try {
    const response = await apiClient.put(`/api/wires/${wireId}/reject`, {
      approvedBy,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw error.response;
    }
    throw new Error("Network error: Unable to process wire rejection.");
  }
};

export default {
  createWire,
  getPendingWires,
  getAllWires,
  approveWire,
  rejectWire,
};
