import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import UptimeAvailabilityHeatmap from "./UptimeAvailabilityHeatmap";

describe("UptimeAvailabilityHeatmap Component", () => {
  it("renders uptime percentage and probe summary", () => {
    render(
      <UptimeAvailabilityHeatmap
        uptimePct={99.85}
        totalProbes={1440}
        failureCount={2}
        timeframe="24h"
      />,
    );

    expect(screen.getByText("99.85%")).toBeInTheDocument();
    expect(screen.getByText("1440")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
