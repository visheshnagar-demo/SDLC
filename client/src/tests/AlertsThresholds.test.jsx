import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AlertsThresholdsPage from "../pages/AlertsThresholdsPage";
import ThresholdTable from "../components/alerts/ThresholdTable";
import * as api from "../services/api";

vi.mock("../services/api", () => ({
  getTanks: vi.fn(),
  getAlerts: vi.fn(),
  getThresholds: vi.fn(),
  updateAlertStatus: vi.fn(),
  createOrUpdateThreshold: vi.fn(),
}));

describe("Alerts & Thresholds Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getTanks.mockResolvedValue([
      { id: "tank-1", name: "Tank 1 - Reef", water_type: "Saltwater" },
    ]);
    api.getAlerts.mockResolvedValue([
      {
        id: "alert-1",
        tank_id: "tank-1",
        parameter_name: "pH",
        recorded_value: 6.2,
        severity: "CRITICAL",
        status: "ACTIVE",
        message: "pH dropped below critical limit 6.5",
        triggered_at: "2026-09-25T10:00:00Z",
      },
    ]);
    api.getThresholds.mockResolvedValue([
      {
        id: "thresh-1",
        tank_id: "tank-1",
        parameter_name: "pH",
        min_threshold: 6.8,
        max_threshold: 7.8,
        is_active: true,
      },
    ]);
  });

  it("renders ThresholdTable with configured parameters", () => {
    const thresholds = [
      {
        id: "1",
        parameter_name: "pH",
        min_threshold: 6.8,
        max_threshold: 7.8,
        is_active: true,
      },
    ];
    render(
      <ThresholdTable
        thresholds={thresholds}
        onEditThreshold={vi.fn()}
        onAddNewThreshold={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Configured Parameter Boundary Limits"),
    ).toBeInTheDocument();
    expect(screen.getByText("pH")).toBeInTheDocument();
    expect(screen.getByText("6.8")).toBeInTheDocument();
    expect(screen.getByText("7.8")).toBeInTheDocument();
  });

  it("renders AlertsThresholdsPage and displays incident triage queue and summary cards", async () => {
    render(
      <MemoryRouter>
        <AlertsThresholdsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Threshold Safety & Alert Center/i),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("CRITICAL ALERTS")).toBeInTheDocument();
      expect(
        screen.getByText("Live Incident Triage Queue"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("pH dropped below critical limit 6.5"),
      ).toBeInTheDocument();
    });
  });
});
