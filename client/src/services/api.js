import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getJobs = async (params = {}) => {
  try {
    const response = await api.get("/api/v1/jobs", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }
};

export const getJobById = async (id) => {
  try {
    const response = await api.get(`/api/v1/jobs/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching job ${id}:`, error);
    throw error;
  }
};

export const createJob = async (jobData) => {
  try {
    const response = await api.post("/api/v1/jobs", jobData);
    return response.data;
  } catch (error) {
    console.error("Error creating job:", error);
    throw error;
  }
};

export const updateJob = async (id, jobData) => {
  try {
    const response = await api.put(`/api/v1/jobs/${id}`, jobData);
    return response.data;
  } catch (error) {
    console.error(`Error updating job ${id}:`, error);
    throw error;
  }
};

export const updateJobStatus = async (id, status) => {
  try {
    const response = await api.patch(`/api/v1/jobs/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error(`Error updating job status for ${id}:`, error);
    throw error;
  }
};

export const deleteJob = async (id) => {
  try {
    const response = await api.delete(`/api/v1/jobs/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting job ${id}:`, error);
    throw error;
  }
};

export const getJobAuditLogs = async (id) => {
  try {
    const response = await api.get(`/api/v1/jobs/${id}/audit-logs`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching audit logs for job ${id}:`, error);
    // Return empty array if audit logs endpoint is not implemented
    return [];
  }
};

export default api;
