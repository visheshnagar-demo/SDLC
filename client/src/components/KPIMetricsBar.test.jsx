import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import KPIMetricsBar from "./KPIMetricsBar";

describe("KPIMetricsBar Component", () => {
  it("renders all four KPI metric cards", () => {
    const visits = [
      { id: "1", status: "CHECKED_IN" },
      { id: "2", status: "PENDING_APPROVAL" },
      { id: "3", status: "CHECKED_OUT" },
    ];

    render(<KPIMetricsBar visits={visits} total={3} />);

    expect(screen.getByText(/Total Visits Logged/i)).toBeInTheDocument();
    expect(screen.getByText(/Currently On-Premises/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending Host Review/i)).toBeInTheDocument();
    expect(screen.getByText(/Completed Departures/i)).toBeInTheDocument();
  });
});
