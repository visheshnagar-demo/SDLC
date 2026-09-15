import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import KPIHeaderStrip from "./KPIHeaderStrip.jsx";

describe("KPIHeaderStrip Component", () => {
  it("renders all KPI cards with proper formatting", () => {
    const mockKpis = {
      sales_per_linear_ft: 145.5,
      private_brand_share_pct: 28.5,
      in_stock_rate_pct: 96.2,
      shelf_capacity_utilization_pct: 92.0,
      cluster_name: "Small Town Value Cluster",
    };

    render(<KPIHeaderStrip kpis={mockKpis} loading={false} />);

    expect(screen.getByText("Sales / Linear Ft")).toBeInTheDocument();
    expect(screen.getByText("$145.50")).toBeInTheDocument();
    expect(screen.getByText("Private Brand Share")).toBeInTheDocument();
    expect(screen.getByText("28.5%")).toBeInTheDocument();
    expect(screen.getByText("In-Stock Rate")).toBeInTheDocument();
    expect(screen.getByText("96.2%")).toBeInTheDocument();
    expect(screen.getByText("Shelf Capacity Utilization")).toBeInTheDocument();
    expect(screen.getByText("92.0%")).toBeInTheDocument();
  });

  it("renders fallback when KPIs are missing or null", () => {
    render(<KPIHeaderStrip kpis={null} loading={false} />);

    const fallbacks = screen.getAllByText("--");
    expect(fallbacks.length).toBeGreaterThanOrEqual(4);
  });

  it("highlights shelf capacity warning when exceeding 100%", () => {
    const mockKpis = {
      sales_per_linear_ft: 145.5,
      private_brand_share_pct: 28.5,
      in_stock_rate_pct: 96.2,
      shelf_capacity_utilization_pct: 104.5,
      cluster_name: "Small Town Value Cluster",
    };

    render(<KPIHeaderStrip kpis={mockKpis} loading={false} />);

    expect(
      screen.getByText(/Warning: Exceeds 100% capacity/i),
    ).toBeInTheDocument();
  });
});
