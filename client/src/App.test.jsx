import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./App.jsx";
import * as api from "./services/api.js";

vi.mock("./services/api.js", () => ({
  getKPIs: vi.fn(),
  getSKUs: vi.fn(),
  getScenarios: vi.fn(),
  evaluateScenario: vi.fn(),
  submitApproval: vi.fn(),
}));

describe("App Component", () => {
  it("renders top navigation and fetches dashboard data", async () => {
    api.getKPIs.mockResolvedValue({
      cluster_name: "Small Town Value Cluster",
      sales_per_linear_ft: 145.5,
      private_brand_share_pct: 28.5,
      in_stock_rate_pct: 96.2,
      shelf_capacity_utilization_pct: 92.0,
    });

    api.getSKUs.mockResolvedValue([
      {
        id: "1",
        sku_code: "SNK-10042",
        name: "DG Brand Potato Chips 10oz",
        category: "Snacks",
        weekly_unit_sales: 340,
        sales_per_linear_ft: 185.0,
        margin_pct: 32.5,
        space_allocation_ft: 2.5,
        is_private_brand: true,
        status_badge: "GROW",
      },
    ]);

    api.getScenarios.mockResolvedValue([
      {
        code: "BALANCED",
        title: "Balanced",
        description: "Optimal margin & private brand expansion.",
        projected_sales_growth_pct: 4.2,
        projected_private_brand_share_pct: 29.5,
        shelf_space_impact_pct: 3.5,
        is_default: true,
        sku_actions_summary: { GROW: 4, MAINTAIN: 12, SWAP: 3, REDUCE: 2 },
      },
    ]);

    api.evaluateScenario.mockResolvedValue({
      scenario_code: "BALANCED",
      scenario_title: "Balanced",
      projected_sales_growth_pct: 4.2,
      projected_private_brand_share_pct: 29.5,
      shelf_space_impact_pct: 3.5,
      sku_actions_summary: { GROW: 4, MAINTAIN: 12, SWAP: 3, REDUCE: 2 },
      guardrails: [
        {
          name: "Private Brand Share ≥ 25.0%",
          passed: true,
          actual_value: "29.5%",
        },
      ],
      can_submit: true,
    });

    render(<App />);

    expect(
      screen.getByText("Dollar General — Cluster Assortment Advisor"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Small Town Value Cluster • 1,240 Stores/i),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("$145.50")).toBeInTheDocument();
      expect(screen.getByText("SNK-10042")).toBeInTheDocument();
      expect(screen.getByText("Balanced")).toBeInTheDocument();
    });
  });
});
