import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";
import DashboardPage from "../pages/DashboardPage";

vi.mock("../services/api", () => ({
  dashboardApi: {
    getMetrics: vi.fn().mockResolvedValue({
      active_channels: "4 Active",
      concurrent_viewers: "1.24M",
      transmission_health_pct: "99.98",
      active_emergency_alerts: 0,
    }),
  },
  channelsApi: {
    getChannels: vi.fn().mockResolvedValue([
      {
        id: "ch-1",
        name: "Global News HD",
        code: "GNN-HD",
        stream_url: "udp://239.1.1.1:5000",
        resolution: "1080p60",
        language: "EN",
        status: "ACTIVE",
        is_live: true,
      },
    ]),
    deleteChannel: vi.fn().mockResolvedValue({}),
  },
  schedulesApi: {
    triggerOverride: vi.fn().mockResolvedValue({}),
  },
}));

describe("DashboardPage Component", () => {
  it("renders master control header and telemetry cards", async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/GLOBAL NEWS NETWORK \/\/ MASTER CONTROL/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/TRIGGER EMERGENCY OVERRIDE/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Channels/i)).toBeInTheDocument();
    expect(screen.getByText(/Concurrent Viewers/i)).toBeInTheDocument();
  });
});
