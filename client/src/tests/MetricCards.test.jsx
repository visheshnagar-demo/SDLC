import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import MetricCards from "../components/releases/MetricCards";

describe("MetricCards Component", () => {
  it("renders metric titles and formatted values", () => {
    render(
      <MetricCards
        totalReleases={12}
        activeReleases={4}
        avgReadiness={82.5}
        unresolvedBlockers={2}
      />,
    );

    expect(screen.getByText("Total Releases")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();

    expect(screen.getByText("Active Releases")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();

    expect(screen.getByText("Avg Readiness")).toBeInTheDocument();
    expect(screen.getByText("82.5%")).toBeInTheDocument();

    expect(screen.getByText("Unresolved Blockers")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("handles zero or empty values gracefully", () => {
    render(<MetricCards />);
    expect(screen.getByText("0.0%")).toBeInTheDocument();
    expect(screen.getByText("Zero blocking defects")).toBeInTheDocument();
  });
});
