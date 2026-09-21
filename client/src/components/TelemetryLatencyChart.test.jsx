import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import TelemetryLatencyChart from "./TelemetryLatencyChart";

describe("TelemetryLatencyChart", () => {
  it("renders empty fallback message when data is empty", () => {
    render(<TelemetryLatencyChart timeSeriesData={[]} />);
    expect(screen.getByText("No Telemetry Data Available")).toBeInTheDocument();
  });

  it("renders chart container and title when data is provided", () => {
    const mockData = [
      {
        timestamp: "2026-09-21T10:00:00Z",
        avg_latency_ms: 45,
        p95_latency_ms: 60,
      },
      {
        timestamp: "2026-09-21T10:05:00Z",
        avg_latency_ms: 50,
        p95_latency_ms: 68,
      },
    ];
    render(<TelemetryLatencyChart timeSeriesData={mockData} timeframe="24h" />);

    expect(screen.getByText(/Response Latency Telemetry/i)).toBeInTheDocument();
    expect(screen.getByText("Avg Latency")).toBeInTheDocument();
    expect(screen.getByText("P95 Tail")).toBeInTheDocument();
  });
});
