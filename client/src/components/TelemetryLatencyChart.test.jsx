import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import TelemetryLatencyChart from "./TelemetryLatencyChart";

const mockTimeSeries = [
  {
    timestamp: "2026-09-21T10:00:00Z",
    avg_latency_ms: 55.4,
    p95_latency_ms: 120.0,
    uptime_pct: 100,
    failure_count: 0,
  },
  {
    timestamp: "2026-09-21T11:00:00Z",
    avg_latency_ms: 60.1,
    p95_latency_ms: 130.0,
    uptime_pct: 100,
    failure_count: 0,
  },
];

describe("TelemetryLatencyChart Component", () => {
  it("renders chart title and SLA baseline description", () => {
    render(
      <TelemetryLatencyChart timeSeriesData={mockTimeSeries} timeframe="24h" />,
    );
    expect(
      screen.getByText(/response latency & telemetry/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/500ms/i)).toBeInTheDocument();
  });

  it("renders empty state when data is empty", () => {
    render(<TelemetryLatencyChart timeSeriesData={[]} timeframe="24h" />);
    expect(
      screen.getByText(/no telemetry time-series points recorded/i),
    ).toBeInTheDocument();
  });
});
