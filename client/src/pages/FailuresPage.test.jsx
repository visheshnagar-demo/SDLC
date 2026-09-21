import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import FailuresPage from "./FailuresPage";
import * as api from "../services/api";

vi.mock("../services/api");

describe("FailuresPage Component", () => {
  it("renders failure incidents and outage information", async () => {
    vi.mocked(api.getGlobalFailures).mockResolvedValue([
      {
        id: "fail-999",
        api_id: "api-1",
        api_name: "Payment Service",
        target_url: "https://pay.internal/health",
        response_status: 504,
        latency_ms: 5002.1,
        operational_status: "Down",
        is_success: false,
        error_message: "Gateway Timeout: connection timed out after 5.0s",
        checked_at: new Date().toISOString(),
      },
    ]);

    vi.mocked(api.getDashboardSummary).mockResolvedValue({
      total_apis: 2,
      active_failures: 1,
      overall_uptime_pct: 95.0,
      average_latency_ms: 250.0,
    });

    render(
      <BrowserRouter>
        <FailuresPage />
      </BrowserRouter>,
    );

    expect(screen.getByText(/api failure inspector/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Payment Service")).toBeInTheDocument();
      expect(screen.getByText("HTTP 504")).toBeInTheDocument();
      expect(screen.getByText(/gateway timeout/i)).toBeInTheDocument();
    });
  });
});
