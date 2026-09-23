import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getSubjects = async () => {
  const response = await apiClient.get("/api/v1/subjects");
  return response.data;
};

export const createSubject = async (subjectData) => {
  const response = await apiClient.post("/api/v1/subjects", subjectData);
  return response.data;
};

export const deleteSubject = async (subjectId) => {
  const response = await apiClient.delete(`/api/v1/subjects/${subjectId}`);
  return response.data;
};

export const getAvailability = async () => {
  const response = await apiClient.get("/api/v1/availability");
  return response.data;
};

export const saveAvailability = async (availabilityData) => {
  const response = await apiClient.post(
    "/api/v1/availability",
    availabilityData,
  );
  return response.data;
};

export const getSchedules = async () => {
  const response = await apiClient.get("/api/v1/schedules");
  return response.data;
};

export const getSchedule = async (id) => {
  const response = await apiClient.get(`/api/v1/schedules/${id}`);
  return response.data;
};

export const generateSchedule = async (payload) => {
  const response = await apiClient.post("/api/v1/schedules/generate", payload);
  return response.data;
};

export const updateSessionStatus = async (sessionId, status) => {
  const response = await apiClient.patch(
    `/api/v1/schedules/sessions/${sessionId}`,
    {
      status,
    },
  );
  return response.data;
};

export default {
  getSubjects,
  createSubject,
  deleteSubject,
  getAvailability,
  saveAvailability,
  getSchedules,
  getSchedule,
  generateSchedule,
  updateSessionStatus,
};
