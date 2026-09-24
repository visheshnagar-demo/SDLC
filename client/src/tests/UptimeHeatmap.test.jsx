import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import UptimeHeatmap from "../components/UptimeHeatmap";

describe("UptimeHeatmap Component", () => {
  it("renders SLA percentage and strip", () => {
    render(<UptimeHeatmap uptimePercentage={99.85} />);
    expect(
      screen.getByText("24-Hour Availability Strip & SLA Health"),
    ).toBeInTheDocument();
    expect(screen.getByText("99.85% Uptime")).toBeInTheDocument();
    expect(screen.getByText("Operational (100%)")).toBeInTheDocument();
  });
});
