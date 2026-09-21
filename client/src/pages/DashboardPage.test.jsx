import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardPage from "./DashboardPage";
import { apiService } from "../services/api";

vi.mock("../services/api", () => ({
  apiService: {
    listApis: vi.fn(),
    getRecentFailures: vi.fn(),
    createApi: vi.fn(),
    updateApi: vi.fn(),
    deleteApi: vi.fn(),
    triggerHealthCheck: vi.fn(),
  },
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders metric cards and overview heading", async () => {
    apiService.listApis.mockResolvedValue([
      {
        id: "api-1",
        name: "User Service",
        target_url: "https://api.example.com/users",
        http_method: "GET",
        current_status: "Healthy",
        last_latency_ms: 32.5,
        is_active: true,
      },
    ]);
    apiService.getRecentFailures.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <DashboardPage refreshTrigger={0} />
      </BrowserRouter>,
    );

    expect(
      screen.getByText("API Health Monitoring Overview"),
    ).toBeInTheDocument();
    expect(screen.getByText("Monitored APIs")).toBeInTheDocument();
    expect(screen.getByText("Overall Uptime")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("User Service")).toBeInTheDocument();
    });
  });
});
