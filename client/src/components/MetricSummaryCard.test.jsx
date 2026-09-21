import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Activity } from "lucide-react";
import MetricSummaryCard from "./MetricSummaryCard";

describe("MetricSummaryCard Component", () => {
  it("renders card title, value, unit, and subtext", () => {
    render(
      <MetricSummaryCard
        title="Total APIs"
        value={12}
        unit="monitored"
        subtext="All active"
        icon={Activity}
        variant="success"
      />,
    );

    expect(screen.getByText("Total APIs")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("monitored")).toBeInTheDocument();
    expect(screen.getByText("All active")).toBeInTheDocument();
  });

  it("renders fallback when value is null", () => {
    render(<MetricSummaryCard title="Avg Latency" value={null} />);
    expect(screen.getByText("Avg Latency")).toBeInTheDocument();
    expect(screen.getByText("--")).toBeInTheDocument();
  });
});
