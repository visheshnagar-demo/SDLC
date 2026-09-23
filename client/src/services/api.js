import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

export const itineraryApi = {
  // Generate a new AI itinerary
  generateItinerary: async (payload) => {
    const response = await apiClient.post(
      "/api/v1/itineraries/generate",
      payload,
    );
    return response.data;
  },

  // Get full itinerary details by ID
  getItinerary: async (id) => {
    const response = await apiClient.get(`/api/v1/itineraries/${id}`);
    return response.data;
  },

  // Update itinerary metadata/budget
  updateItinerary: async (id, payload) => {
    const response = await apiClient.put(`/api/v1/itineraries/${id}`, payload);
    return response.data;
  },

  // Add custom activity to a day
  addActivity: async (itineraryId, payload) => {
    const response = await apiClient.post(
      `/api/v1/itineraries/${itineraryId}/activities`,
      payload,
    );
    return response.data;
  },

  // Update an existing activity
  updateActivity: async (itineraryId, activityId, payload) => {
    const response = await apiClient.put(
      `/api/v1/itineraries/${itineraryId}/activities/${activityId}`,
      payload,
    );
    return response.data;
  },

  // Delete an activity
  deleteActivity: async (itineraryId, activityId) => {
    const response = await apiClient.delete(
      `/api/v1/itineraries/${itineraryId}/activities/${activityId}`,
    );
    return response.data;
  },

  // Reorder activities
  reorderActivities: async (itineraryId, payload) => {
    const response = await apiClient.post(
      `/api/v1/itineraries/${itineraryId}/activities/reorder`,
      payload,
    );
    return response.data;
  },

  // Export PDF
  exportPdf: async (itineraryId) => {
    const response = await apiClient.get(
      `/api/v1/itineraries/${itineraryId}/export/pdf`,
      { responseType: "blob" },
    );
    return response.data;
  },

  // Export iCalendar (.ics)
  exportIcs: async (itineraryId) => {
    const response = await apiClient.get(
      `/api/v1/itineraries/${itineraryId}/export/ics`,
      { responseType: "blob" },
    );
    return response.data;
  },

  // Generate shareable token
  shareItinerary: async (itineraryId) => {
    const response = await apiClient.post(
      `/api/v1/itineraries/${itineraryId}/share`,
    );
    return response.data;
  },

  // Retrieve shared itinerary (public view)
  getSharedItinerary: async (shareToken) => {
    const response = await apiClient.get(
      `/api/v1/itineraries/shared/${shareToken}`,
    );
    return response.data;
  },

  // List recent itineraries (if available)
  listItineraries: async () => {
    const response = await apiClient.get("/api/v1/itineraries");
    return response.data;
  },
};

export default itineraryApi;
