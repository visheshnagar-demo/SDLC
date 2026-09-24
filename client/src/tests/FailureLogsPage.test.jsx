import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import FailureLogsPage from "../pages/FailureLogsPage";
import * as api from "../services/api";

vi.mock("../services/api");

describe("FailureLogsPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders failure logs page and anomalous events", async () => {
    vi.mocked(api.getHealthLogs).mockResolvedValue([
      {
        id: "fail-1",
        monitor_name: "Auth API",
        endpoint_url: "https://auth.example.com/health",
        status: "UNHEALTHY",
        status_code: 500,
        latency_ms: 3500,
        error_message: "Internal Server Error",
        executed_at: "2026-09-24T11:00:00Z",
      },
    ]);

    vi.mocked(api.getMonitors).mockResolvedValue([
      { id: "mon-1", name: "Auth API", http_method: "GET" },
    ]);

    render(
      <BrowserRouter>
        <FailureLogsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Failure Logs & Exception Diagnostics"),
      ).toBeInTheDocument();
      expect(screen.getByText("Auth API")).toBeInTheDocument();
      expect(screen.getByText(/Internal Server Error/i)).toBeInTheDocument();
    });
  });
});
