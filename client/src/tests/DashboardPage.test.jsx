import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import DashboardPage from "../pages/DashboardPage";
import * as api from "../services/api";

vi.mock("../services/api");

describe("DashboardPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dashboard with stat cards and monitors list", async () => {
    vi.mocked(api.getMonitors).mockResolvedValue([
      {
        id: "mon-1",
        name: "User Service",
        url: "https://user.example.com/health",
        http_method: "GET",
        check_interval_seconds: 60,
        expected_status_code: 200,
        timeout_ms: 5000,
        is_active: true,
        current_status: "HEALTHY",
        last_latency_ms: 95.2,
        last_checked_at: "2026-09-24T12:00:00Z",
      },
    ]);

    vi.mocked(api.getMetrics).mockResolvedValue({
      time_window: "24h",
      summary: {
        total_checks: 120,
        healthy_checks: 118,
        uptime_percentage: 98.3,
        average_latency_ms: 104.5,
      },
    });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("API Health Sentinel")).toBeInTheDocument();
      expect(screen.getByText("System Uptime")).toBeInTheDocument();
      expect(screen.getByText("User Service")).toBeInTheDocument();
    });
  });
});
