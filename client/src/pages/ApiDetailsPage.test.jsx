import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import ApiDetailsPage from "./ApiDetailsPage";
import * as api from "../services/api";

vi.mock("../services/api");

describe("ApiDetailsPage Component", () => {
  it("fetches and renders API details and telemetry", async () => {
    vi.mocked(api.getApiDetails).mockResolvedValue({
      id: "api-123",
      name: "Authentication Service",
      target_url: "https://auth.internal/v1/health",
      http_method: "GET",
      interval_seconds: 60,
      expected_status: 200,
      timeout_seconds: 5.0,
      is_active: true,
      current_status: "Healthy",
      last_latency_ms: 45.0,
      request_headers: { Authorization: "Bearer test" },
      request_body: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    vi.mocked(api.getApiMetrics).mockResolvedValue({
      timeframe: "24h",
      total_probes: 100,
      uptime_pct: 99.5,
      avg_latency_ms: 45.2,
      p95_latency_ms: 110.0,
      failure_count: 1,
      time_series: [
        {
          timestamp: new Date().toISOString(),
          avg_latency_ms: 45.2,
          p95_latency_ms: 110.0,
          uptime_pct: 99.5,
          probe_count: 10,
          failure_count: 0,
        },
      ],
    });

    vi.mocked(api.getApiLogs).mockResolvedValue([
      {
        id: "log-1",
        api_id: "api-123",
        response_status: 200,
        latency_ms: 44.5,
        operational_status: "Healthy",
        is_success: true,
        error_message: null,
        checked_at: new Date().toISOString(),
      },
    ]);

    render(
      <MemoryRouter initialEntries={["/apis/api-123"]}>
        <Routes>
          <Route path="/apis/:apiId" element={<ApiDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      const titles = screen.getAllByText("Authentication Service");
      expect(titles.length).toBeGreaterThanOrEqual(1);
      expect(
        screen.getByText("https://auth.internal/v1/health"),
      ).toBeInTheDocument();
      expect(screen.getByText(/trigger probe now/i)).toBeInTheDocument();
      expect(
        screen.getByText(/historical health probe executions/i),
      ).toBeInTheDocument();
    });
  });
});
