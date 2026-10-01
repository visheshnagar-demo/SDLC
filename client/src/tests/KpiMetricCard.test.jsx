import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import KpiMetricCard from "../components/KpiMetricCard";

describe("KpiMetricCard Component", () => {
  it("renders metric title, value and trend accurately", () => {
    render(
      <KpiMetricCard
        title="Total Patients"
        value="1,420"
        change="+12% this month"
        trend="up"
        badgeText="Active"
        badgeVariant="success"
      />,
    );

    expect(screen.getByText("Total Patients")).toBeInTheDocument();
    expect(screen.getByText("1,420")).toBeInTheDocument();
    expect(screen.getByText("+12% this month")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});
