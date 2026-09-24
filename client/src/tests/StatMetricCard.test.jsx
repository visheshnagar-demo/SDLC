import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import StatMetricCard from "../components/StatMetricCard";
import { Activity } from "lucide-react";

describe("StatMetricCard Component", () => {
  it("renders title, value and subtitle correctly", () => {
    render(
      <StatMetricCard
        title="System Uptime"
        value="99.9%"
        subtitle="Trailing 24 hours"
        icon={Activity}
      />,
    );
    expect(screen.getByText("System Uptime")).toBeInTheDocument();
    expect(screen.getByText("99.9%")).toBeInTheDocument();
    expect(screen.getByText("Trailing 24 hours")).toBeInTheDocument();
  });

  it("renders loading state without throwing", () => {
    const { container } = render(
      <StatMetricCard title="Active Monitors" loading={true} />,
    );
    expect(screen.getByText("Active Monitors")).toBeInTheDocument();
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});
