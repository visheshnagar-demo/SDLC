import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import DashboardPage from "./DashboardPage";
import * as api from "../services/api";

vi.mock("../services/api");

describe("DashboardPage Component", () => {
  it("renders dashboard with summary metrics and API list", async () => {
    vi.mocked(api.getDashboardSummary).mockResolvedValue({
      total_apis: 3,
      active_apis: 3,
      healthy_apis: 3,
      degraded_apis: 0,
      down_apis: 0,
      active_failures: 0,
      overall_uptime_pct: 100.0,
      average_latency_ms: 48.5,
      total_checks_24h: 120,
      failure_checks_24h: 0,
    });

    vi.mocked(api.listApis).mockResolvedValue([
      {
        id: "api-1",
        name: "User Management API",
        target_url: "https://api.users.internal/health",
        http_method: "GET",
        interval_seconds: 60,
        expected_status: 200,
        current_status: "Healthy",
        last_latency_ms: 32.1,
        is_active: true,
        last_checked_at: new Date().toISOString(),
        stats_24h: { uptime_pct: 100 },
      },
    ]);

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    expect(
      screen.getByText(/real-time health & telemetry/i),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("User Management API")).toBeInTheDocument();
    });

    expect(screen.getByText("Total Monitored APIs")).toBeInTheDocument();
  });
});
