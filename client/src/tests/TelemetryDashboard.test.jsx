import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TelemetryDashboardPage from "../pages/TelemetryDashboardPage";
import MetricCard from "../components/telemetry/MetricCard";
import * as api from "../services/api";

vi.mock("../services/api", () => ({
  getTanks: vi.fn(),
  getLatestTelemetry: vi.fn(),
  getTelemetryHistory: vi.fn(),
  getAlerts: vi.fn(),
  createTank: vi.fn(),
  ingestTelemetry: vi.fn(),
}));

describe("Telemetry Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getTanks.mockResolvedValue([
      {
        id: "tank-1",
        name: "Tank 1 - Reef",
        water_type: "Saltwater",
        location: "Main Exhibit",
        capacity_liters: 1000,
      },
    ]);
    api.getAlerts.mockResolvedValue([]);
    api.getLatestTelemetry.mockResolvedValue({
      tank_id: "tank-1",
      reading: {
        ph_level: 7.4,
        dissolved_oxygen: 6.8,
        temperature_c: 25.4,
        ammonia_ppm: 0.02,
        recorded_at: "2026-09-25T10:00:00Z",
      },
      ph_status: "SAFE",
      oxygen_status: "SAFE",
      temperature_status: "SAFE",
      ammonia_status: "SAFE",
    });
    api.getTelemetryHistory.mockResolvedValue([
      {
        ph_level: 7.4,
        dissolved_oxygen: 6.8,
        temperature_c: 25.4,
        ammonia_ppm: 0.02,
        recorded_at: "2026-09-25T10:00:00Z",
      },
    ]);
  });

  it("renders MetricCard with provided values and safe badge", () => {
    render(
      <MetricCard
        title="pH Level"
        value="7.40"
        unit="pH"
        status="SAFE"
        safeRange="6.8 - 7.8 pH"
      />,
    );

    expect(screen.getByText("pH Level")).toBeInTheDocument();
    expect(screen.getByText("7.40")).toBeInTheDocument();
    expect(screen.getByText("Safe")).toBeInTheDocument();
    expect(screen.getByText("6.8 - 7.8 pH")).toBeInTheDocument();
  });

  it("renders TelemetryDashboardPage without crashing and displays header and metric cards", async () => {
    render(
      <MemoryRouter>
        <TelemetryDashboardPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Live Telemetry & Tank Monitor/i),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("pH Level")).toBeInTheDocument();
      expect(screen.getByText("Dissolved Oxygen")).toBeInTheDocument();
      expect(screen.getByText("Temperature")).toBeInTheDocument();
      expect(screen.getByText("Ammonia (NH3)")).toBeInTheDocument();
    });
  });
});
