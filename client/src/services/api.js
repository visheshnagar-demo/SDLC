import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Initial mock fallback data for graceful GET fallback when server is unreachable or endpoints return 404
export const INITIAL_FLOCKS = [
  {
    id: "flock-101",
    name: "Flock A-101",
    breed: "Rhode Island Red",
    hatch_date: "2025-01-10",
    initial_count: 500,
    active_count: 496,
    coop_location: "Coop #1",
    status: "Active",
    created_at: "2025-01-10T08:00:00Z",
  },
  {
    id: "flock-102",
    name: "Flock B-202",
    breed: "Leghorn White",
    hatch_date: "2025-02-15",
    initial_count: 400,
    active_count: 398,
    coop_location: "Coop #2",
    status: "Active",
    created_at: "2025-02-15T08:00:00Z",
  },
  {
    id: "flock-103",
    name: "Flock C-303",
    breed: "Plymouth Rock",
    hatch_date: "2024-11-01",
    initial_count: 350,
    active_count: 0,
    coop_location: "Coop #3",
    status: "Archived",
    created_at: "2024-11-01T08:00:00Z",
  },
];

export const INITIAL_EGG_COLLECTIONS = [
  {
    id: "egg-1",
    flock_id: "flock-101",
    flock_name: "Flock A-101",
    collection_date: new Date().toISOString().split("T")[0],
    session: "Morning",
    grade_large: 400,
    grade_medium: 40,
    grade_small: 10,
    damaged: 0,
    total_count: 450,
    created_at: new Date().toISOString(),
  },
  {
    id: "egg-2",
    flock_id: "flock-102",
    flock_name: "Flock B-202",
    collection_date: new Date().toISOString().split("T")[0],
    session: "Morning",
    grade_large: 310,
    grade_medium: 40,
    grade_small: 10,
    damaged: 2,
    total_count: 362,
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_FEED_INVENTORY = [
  {
    id: "feed-1",
    feed_type: "Layer Mash",
    quantity_kg: 440.0,
    reorder_threshold_kg: 100.0,
    updated_at: new Date().toISOString(),
  },
  {
    id: "feed-2",
    feed_type: "Starter Feed",
    quantity_kg: 85.0,
    reorder_threshold_kg: 100.0,
    updated_at: new Date().toISOString(),
  },
  {
    id: "feed-3",
    feed_type: "Grower Pellets",
    quantity_kg: 250.0,
    reorder_threshold_kg: 80.0,
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_FEED_LOGS = [
  {
    id: "flog-1",
    flock_id: "flock-101",
    flock_name: "Flock A-101",
    feed_id: "feed-1",
    feed_type: "Layer Mash",
    quantity_used_kg: 60.0,
    log_date: new Date().toISOString().split("T")[0],
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_HEALTH_LOGS = [
  {
    id: "hlog-1",
    flock_id: "flock-101",
    flock_name: "Flock A-101",
    log_date: new Date().toISOString().split("T")[0],
    log_type: "MORTALITY",
    quantity: 2,
    notes: "Natural Causes - routine heat stress check",
    created_at: new Date().toISOString(),
  },
  {
    id: "hlog-2",
    flock_id: "flock-102",
    flock_name: "Flock B-202",
    log_date: new Date().toISOString().split("T")[0],
    log_type: "VACCINATION",
    quantity: 398,
    notes: "Newcastle Disease booster dose",
    created_at: new Date().toISOString(),
  },
];

// --- API Service Calls ---

// Flocks API
export const getFlocks = async () => {
  try {
    const response = await api.get("/api/v1/flocks");
    return response.data;
  } catch (error) {
    console.warn(
      "GET /api/v1/flocks failed or endpoint missing, returning fallback flocks data",
      error,
    );
    return INITIAL_FLOCKS;
  }
};

export const createFlock = async (flockData) => {
  const response = await api.post("/api/v1/flocks", flockData);
  return response.data;
};

export const updateFlock = async (flockId, flockData) => {
  const response = await api.put(`/api/v1/flocks/${flockId}`, flockData);
  return response.data;
};

export const deactivateFlock = async (flockId) => {
  try {
    const response = await api.post(`/api/v1/flocks/${flockId}/deactivate`);
    return response.data;
  } catch (error) {
    const response = await api.patch(`/api/v1/flocks/${flockId}`, {
      status: "Archived",
    });
    return response.data;
  }
};

// Egg Collections API
export const getEggCollections = async (params = {}) => {
  try {
    const response = await api.get("/api/v1/egg-collections", { params });
    return response.data;
  } catch (error) {
    console.warn(
      "GET /api/v1/egg-collections failed, returning fallback data",
      error,
    );
    return INITIAL_EGG_COLLECTIONS;
  }
};

export const createEggCollection = async (collectionData) => {
  const response = await api.post("/api/v1/egg-collections", collectionData);
  return response.data;
};

// Feed Inventory API
export const getFeedInventory = async () => {
  try {
    const response = await api.get("/api/v1/feed-inventory");
    return response.data;
  } catch (error) {
    console.warn(
      "GET /api/v1/feed-inventory failed, returning fallback data",
      error,
    );
    return INITIAL_FEED_INVENTORY;
  }
};

export const createFeedInventory = async (inventoryData) => {
  const response = await api.post("/api/v1/feed-inventory", inventoryData);
  return response.data;
};

export const getFeedLogs = async () => {
  try {
    const response = await api.get("/api/v1/feed-logs");
    return response.data;
  } catch (error) {
    console.warn(
      "GET /api/v1/feed-logs failed, returning fallback data",
      error,
    );
    return INITIAL_FEED_LOGS;
  }
};

export const logFeedConsumption = async (feedLogData) => {
  const response = await api.post("/api/v1/feed-logs", feedLogData);
  return response.data;
};

// Health Logs API
export const getHealthLogs = async () => {
  try {
    const response = await api.get("/api/v1/health-logs");
    return response.data;
  } catch (error) {
    console.warn(
      "GET /api/v1/health-logs failed, returning fallback data",
      error,
    );
    return INITIAL_HEALTH_LOGS;
  }
};

export const createHealthLog = async (healthData) => {
  const response = await api.post("/api/v1/health-logs", healthData);
  return response.data;
};

// Analytics Dashboard API
export const getDashboardAnalytics = async () => {
  try {
    const response = await api.get("/api/v1/analytics/dashboard");
    return response.data;
  } catch (error) {
    console.warn(
      "GET /api/v1/analytics/dashboard failed, calculating fallback analytics",
      error,
    );
    return {
      total_active_flocks: 2,
      total_active_hens: 894,
      today_egg_total: 812,
      overall_laying_rate_pct: 90.8,
      low_stock_alerts: 1,
      recent_health_events_count: 2,
    };
  }
};
