import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "../App";
import * as api from "../services/api";

vi.mock("../services/api");

describe("App Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getAlerts.mockResolvedValue([]);
    api.getTanks.mockResolvedValue([
      {
        id: "tank-1",
        name: "Main Reef Tank",
        location: "Atrium",
        capacity_liters: 500,
        water_type: "Saltwater",
      },
    ]);
    api.getLatestTelemetry.mockResolvedValue({
      tank_id: "tank-1",
      reading: {
        ph_level: 7.4,
        dissolved_oxygen: 6.8,
        temperature_c: 25.4,
        ammonia_ppm: 0.02,
      },
      ph_status: "SAFE",
      oxygen_status: "SAFE",
      temperature_status: "SAFE",
      ammonia_status: "SAFE",
    });
    api.getTelemetryHistory.mockResolvedValue([]);
  });

  it("renders application navigation and header branding", async () => {
    render(<App />);
    expect(screen.getAllByText(/AquaSense/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Live Telemetry/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Thresholds & Alerts/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Feeding Schedules/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Health & Equipment/i)[0]).toBeInTheDocument();
  });
});
