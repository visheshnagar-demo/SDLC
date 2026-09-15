import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ScenarioSelector from "./ScenarioSelector.jsx";

const mockScenarios = [
  {
    code: "CONSERVATIVE",
    title: "Conservative",
    description: "Low displacement, minor SKU updates.",
    projected_sales_growth_pct: 1.8,
    projected_private_brand_share_pct: 26.0,
    shelf_space_impact_pct: 1.2,
    is_default: false,
    sku_actions_summary: { SWAP: 1, REDUCE: 1, GROW: 2, MAINTAIN: 17 },
  },
  {
    code: "BALANCED",
    title: "Balanced",
    description: "Optimal margin & private brand expansion.",
    projected_sales_growth_pct: 4.2,
    projected_private_brand_share_pct: 29.5,
    shelf_space_impact_pct: 3.5,
    is_default: true,
    sku_actions_summary: { SWAP: 3, REDUCE: 2, GROW: 4, MAINTAIN: 12 },
  },
  {
    code: "AGGRESSIVE",
    title: "Aggressive",
    description: "Maximum yield & rapid brand acceleration.",
    projected_sales_growth_pct: 8.5,
    projected_private_brand_share_pct: 32.0,
    shelf_space_impact_pct: 7.0,
    is_default: false,
    sku_actions_summary: { SWAP: 5, REDUCE: 4, GROW: 6, MAINTAIN: 6 },
  },
];

describe("ScenarioSelector Component", () => {
  it("renders all 3 scenario cards with impact projections", () => {
    const onSelect = vi.fn();
    render(
      <ScenarioSelector
        scenarios={mockScenarios}
        selectedScenarioCode="BALANCED"
        onSelectScenario={onSelect}
        loading={false}
      />,
    );

    expect(screen.getByText("Conservative")).toBeInTheDocument();
    expect(screen.getByText("Balanced")).toBeInTheDocument();
    expect(screen.getByText("Aggressive")).toBeInTheDocument();
    expect(screen.getByText("+4.2% Sales Growth")).toBeInTheDocument();
    expect(screen.getByText("29.5% Private Brand Share")).toBeInTheDocument();
  });

  it("triggers onSelectScenario when a scenario card is clicked", () => {
    const onSelect = vi.fn();
    render(
      <ScenarioSelector
        scenarios={mockScenarios}
        selectedScenarioCode="BALANCED"
        onSelectScenario={onSelect}
        loading={false}
      />,
    );

    const aggressiveCard = screen.getByText("Aggressive");
    fireEvent.click(aggressiveCard);

    expect(onSelect).toHaveBeenCalledWith("AGGRESSIVE");
  });
});
