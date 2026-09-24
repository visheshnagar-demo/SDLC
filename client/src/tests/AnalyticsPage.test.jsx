import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import AnalyticsPage from "../pages/AnalyticsPage";
import * as api from "../services/api";

vi.mock("../services/api");

describe("AnalyticsPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders analytics metrics and charts", async () => {
    vi.mocked(api.getMetrics).mockResolvedValue({
      time_window: "24h",
      summary: {
        total_checks: 500,
        healthy_checks: 495,
        uptime_percentage: 99.0,
        average_latency_ms: 110.2,
        p95_latency_ms: 180.0,
        p99_latency_ms: 250.0,
      },
      latency_timeline: [],
    });

    vi.mocked(api.getMonitors).mockResolvedValue([
      {
        id: "mon-1",
        name: "Database Proxy",
        url: "https://db.example.com/health",
        http_method: "GET",
        current_status: "HEALTHY",
        last_latency_ms: 45.0,
        check_interval_seconds: 30,
      },
    ]);

    vi.mocked(api.getHealthLogs).mockResolvedValue([]);

    render(
      <BrowserRouter>
        <AnalyticsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "Historical Telemetry Analytics & Performance Metrics",
        ),
      ).toBeInTheDocument();
      expect(screen.getByText("Service Availability")).toBeInTheDocument();
      expect(screen.getAllByText("Database Proxy").length).toBeGreaterThan(0);
    });
  });
});
