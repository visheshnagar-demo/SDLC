import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Initial mock fallback data for initial render if backend is empty / disconnected
export const MOCK_TANKS = [
  {
    id: "tank-a",
    name: "Storage Tank A (Main Rooftop)",
    location: "Building 1 - Roof",
    total_capacity_liters: 10000,
    current_volume_liters: 7500,
    status: "ACTIVE",
    net_flow_rate_lpm: 120,
    fill_percentage: 75,
  },
  {
    id: "tank-b",
    name: "Storage Tank B (East Wing)",
    location: "Building 2 - Ground",
    total_capacity_liters: 15000,
    current_volume_liters: 5250,
    status: "ACTIVE",
    net_flow_rate_lpm: -45,
    fill_percentage: 35,
  },
  {
    id: "tank-c",
    name: "Storage Tank C (Retention Basin)",
    location: "Landscape Zone",
    total_capacity_liters: 25000,
    current_volume_liters: 24250,
    status: "OVERFLOW_WARNING",
    net_flow_rate_lpm: 180,
    fill_percentage: 97,
  },
];

export const MOCK_QUALITY = {
  ph_level: 7.2,
  turbidity_ntu: 1.4,
  tds_ppm: 145,
  pass_status: true,
  backwash_scheduled: false,
  filtration_unit: "Filtration Unit 2",
  operating_hours: 485,
  active_cycle: "NORMAL_FILTRATION",
  history: [
    { timestamp: "10:00", ph: 7.1, turbidity: 1.2, tds: 140 },
    { timestamp: "11:00", ph: 7.3, turbidity: 1.5, tds: 148 },
    { timestamp: "12:00", ph: 7.2, turbidity: 1.4, tds: 145 },
    { timestamp: "13:00", ph: 6.9, turbidity: 1.8, tds: 152 },
    { timestamp: "14:00", ph: 7.2, turbidity: 1.4, tds: 145 },
  ],
};

export const MOCK_YIELD = {
  catchment_area_sqm: 500,
  precipitation_mm: 25,
  efficiency_factor: 0.9,
  harvested_liters: 11250,
  historical_rainfall: [
    { date: "Mon", precipitation_mm: 12, yield_liters: 5400 },
    { date: "Tue", precipitation_mm: 5, yield_liters: 2250 },
    { date: "Wed", precipitation_mm: 35, yield_liters: 15750 },
    { date: "Thu", precipitation_mm: 0, yield_liters: 0 },
    { date: "Fri", precipitation_mm: 18, yield_liters: 8100 },
    { date: "Sat", precipitation_mm: 25, yield_liters: 11250 },
    { date: "Sun", precipitation_mm: 8, yield_liters: 3600 },
  ],
};

export const MOCK_ALERTS = [
  {
    id: "alt-001",
    severity: "MEDIUM",
    category: "MAINTENANCE",
    message:
      "Filtration Unit 2 reaching 500 operating hours - Filter Cartridge Replacement Due",
    is_acknowledged: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "alt-002",
    severity: "HIGH",
    category: "OVERFLOW",
    message:
      "Storage Tank C near overflow capacity (97%). Auto-diverting to storm well.",
    is_acknowledged: false,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "alt-003",
    severity: "LOW",
    category: "TELEMETRY",
    message: "Rain gauge sensor battery at 15% in East Wing Weather Station.",
    is_acknowledged: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export async function fetchTanks() {
  try {
    const res = await api.get("/api/v1/tanks");
    return Array.isArray(res.data) && res.data.length > 0
      ? res.data
      : MOCK_TANKS;
  } catch (err) {
    console.warn(
      "API /api/v1/tanks unreachable, using fallback mock data:",
      err.message,
    );
    return MOCK_TANKS;
  }
}

export async function createTank(tankData) {
  const res = await api.post("/api/v1/tanks", tankData);
  return res.data;
}

export async function fetchTankStatus(tankId) {
  try {
    const res = await api.get(`/api/v1/tanks/${tankId}/status`);
    return res.data;
  } catch (err) {
    console.warn(
      `API /api/v1/tanks/${tankId}/status unreachable, using fallback data:`,
      err.message,
    );
    const mock = MOCK_TANKS.find((t) => t.id === tankId) || MOCK_TANKS[0];
    return {
      tank_id: tankId,
      water_level_liters: mock.current_volume_liters,
      flow_rate_lpm: mock.net_flow_rate_lpm,
      head_pressure_psi: 14.5,
      water_temp_c: 18.2,
      last_updated: new Date().toISOString(),
    };
  }
}

export async function postTelemetry(telemetryData) {
  const res = await api.post("/api/v1/sensors/telemetry", telemetryData);
  return res.data;
}

export async function fetchWaterQuality() {
  try {
    const res = await api.get("/api/v1/quality");
    return res.data && typeof res.data === "object" ? res.data : MOCK_QUALITY;
  } catch (err) {
    console.warn(
      "API /api/v1/quality unreachable, using fallback mock data:",
      err.message,
    );
    return MOCK_QUALITY;
  }
}

export async function triggerBackwash(payload = {}) {
  const res = await api.post("/api/v1/quality/backwash", payload);
  return res.data;
}

export async function fetchYieldAnalytics() {
  try {
    const res = await api.get("/api/v1/analytics/yield");
    return res.data && typeof res.data === "object" ? res.data : MOCK_YIELD;
  } catch (err) {
    console.warn(
      "API /api/v1/analytics/yield unreachable, using fallback mock data:",
      err.message,
    );
    return MOCK_YIELD;
  }
}

export async function fetchAlerts() {
  try {
    const res = await api.get("/api/v1/alerts");
    return Array.isArray(res.data) ? res.data : MOCK_ALERTS;
  } catch (err) {
    console.warn(
      "API /api/v1/alerts unreachable, using fallback mock data:",
      err.message,
    );
    return MOCK_ALERTS;
  }
}

export async function acknowledgeAlert(alertId) {
  const res = await api.post(`/api/v1/alerts/${alertId}/acknowledge`);
  return res.data;
}

export default api;
