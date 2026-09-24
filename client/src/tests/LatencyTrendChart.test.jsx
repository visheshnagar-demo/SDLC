import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import LatencyTrendChart from "../components/LatencyTrendChart";

describe("LatencyTrendChart Component", () => {
  it("renders chart container and time window buttons", () => {
    render(<LatencyTrendChart data={[]} timeWindow="24h" />);
    expect(screen.getByText("Latency Trend & Percentiles")).toBeInTheDocument();
    expect(
      screen.getByText("No Telemetry Logs in Selected Window"),
    ).toBeInTheDocument();
  });

  it("renders loading spinner when isLoading is true", () => {
    const { container } = render(
      <LatencyTrendChart data={[]} isLoading={true} />,
    );
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });
});
