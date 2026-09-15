import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

export const classifyEmailText = async ({ text, subject, sender }) => {
  const payload = {
    text,
    subject: subject || null,
    sender: sender || null,
  };
  const response = await apiClient.post("/api/v1/emails/classify", payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.data;
};

export const classifyEmailFile = async ({ file, subject, sender }) => {
  const formData = new FormData();
  formData.append("file", file);
  if (subject) formData.append("subject", subject);
  if (sender) formData.append("sender", sender);

  const response = await apiClient.post("/api/v1/emails/classify", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const fetchEmails = async (params = {}) => {
  const cleanParams = {};
  if (params.category && params.category !== "ALL") {
    cleanParams.category = params.category;
  }
  if (
    params.min_confidence !== undefined &&
    params.min_confidence !== null &&
    params.min_confidence !== ""
  ) {
    cleanParams.min_confidence = Number(params.min_confidence);
  }
  if (params.search && params.search.trim() !== "") {
    cleanParams.search = params.search.trim();
  }
  if (params.date_from) {
    cleanParams.date_from = params.date_from;
  }
  if (params.date_to) {
    cleanParams.date_to = params.date_to;
  }
  if (params.skip !== undefined) {
    cleanParams.skip = params.skip;
  }
  if (params.limit !== undefined) {
    cleanParams.limit = params.limit;
  }

  const response = await apiClient.get("/api/v1/emails", {
    params: cleanParams,
  });
  return response.data;
};

export const fetchMetrics = async () => {
  const response = await apiClient.get("/api/v1/emails/metrics");
  return response.data;
};

export const fetchEmailById = async (emailId) => {
  const response = await apiClient.get(`/api/v1/emails/${emailId}`);
  return response.data;
};

export const overrideCategory = async (emailId, category) => {
  const response = await apiClient.patch(`/api/v1/emails/${emailId}`, {
    category,
  });
  return response.data;
};

export const deleteEmail = async (emailId) => {
  const response = await apiClient.delete(`/api/v1/emails/${emailId}`);
  return response.data;
};

export const checkHealth = async () => {
  const response = await apiClient.get("/api/v1/health");
  return response.data;
};
