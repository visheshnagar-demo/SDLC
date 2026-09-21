import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import MetricSummaryCard from "./MetricSummaryCard";

describe("MetricSummaryCard", () => {
  it("renders title, value, and subtitle correctly", () => {
    render(
      <MetricSummaryCard
        title="Total APIs"
        value="15"
        subtitle="12 Active"
        variant="cyan"
        iconType="activity"
      />,
    );

    expect(screen.getByText("Total APIs")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("12 Active")).toBeInTheDocument();
  });

  it("renders fallback when value is null", () => {
    render(<MetricSummaryCard title="Average Latency" value={null} />);
    expect(screen.getByText("Average Latency")).toBeInTheDocument();
    expect(screen.getByText("--")).toBeInTheDocument();
  });
});
