import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

export const emailService = {
  /**
   * Ingest an email via raw text payload
   * @param {{ subject?: string, body: string }} payload
   */
  async ingestRawText(payload) {
    const response = await apiClient.post("/api/v1/emails/text", payload);
    return response.data;
  },

  /**
   * Ingest an email via multipart file upload (.eml, .msg, .txt up to 10MB)
   * @param {File} file
   */
  async uploadEmailFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post("/api/v1/emails/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * List and filter classified emails with pagination and search
   * @param {{ skip?: number, limit?: number, search?: string, category?: string, status?: string }} params
   */
  async getEmails(params = {}) {
    const response = await apiClient.get("/api/v1/emails", { params });
    return response.data;
  },

  /**
   * Get email details by ID
   * @param {string} id
   */
  async getEmailById(id) {
    const response = await apiClient.get(`/api/v1/emails/${id}`);
    return response.data;
  },

  /**
   * Override category classification manually
   * @param {string} id
   * @param {{ category: string, notes?: string }} payload
   */
  async overrideCategory(id, payload) {
    const response = await apiClient.patch(
      `/api/v1/emails/${id}/override`,
      payload,
    );
    return response.data;
  },

  /**
   * Health check endpoint
   */
  async checkHealth() {
    const response = await apiClient.get("/health");
    return response.data;
  },
};

export default emailService;
