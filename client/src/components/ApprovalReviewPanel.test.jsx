import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ApprovalReviewPanel from "./ApprovalReviewPanel.jsx";

const mockScenario = {
  code: "BALANCED",
  title: "Balanced",
  projected_sales_growth_pct: 4.2,
  projected_private_brand_share_pct: 29.5,
  shelf_space_impact_pct: 3.5,
  sku_actions_summary: { GROW: 4, MAINTAIN: 12, SWAP: 3, REDUCE: 2 },
};

const mockEvaluation = {
  scenario_code: "BALANCED",
  sku_actions_summary: { GROW: 4, MAINTAIN: 12, SWAP: 3, REDUCE: 2 },
  guardrails: [
    {
      name: "Private Brand Share ≥ 25.0%",
      passed: true,
      actual_value: "29.5%",
    },
    {
      name: "Space Displacement ≤ 10.0%",
      passed: true,
      actual_value: "3.5%",
    },
  ],
  can_submit: true,
};

describe("ApprovalReviewPanel Component", () => {
  it("renders active scenario summary, SKU counts, and guardrail pass indicators", () => {
    const onSubmit = vi.fn();
    render(
      <ApprovalReviewPanel
        scenario={mockScenario}
        evaluation={mockEvaluation}
        onSubmit={onSubmit}
        submitting={false}
      />,
    );

    expect(screen.getByText("Approval Review Panel")).toBeInTheDocument();
    expect(screen.getByText(/Balanced Strategy/i)).toBeInTheDocument();
    expect(screen.getByText("4 GROW")).toBeInTheDocument();
    expect(screen.getByText("12 MAINTAIN")).toBeInTheDocument();
    expect(screen.getByText("3 SWAP")).toBeInTheDocument();
    expect(screen.getByText("2 REDUCE")).toBeInTheDocument();
    expect(screen.getByText("Private Brand Share ≥ 25.0%")).toBeInTheDocument();
    expect(screen.getByText(/29.5% \(PASS ✓\)/i)).toBeInTheDocument();
  });

  it("calls onSubmit when submit button is clicked and guardrails pass", () => {
    const onSubmit = vi.fn();
    render(
      <ApprovalReviewPanel
        scenario={mockScenario}
        evaluation={mockEvaluation}
        onSubmit={onSubmit}
        submitting={false}
      />,
    );

    const submitBtn = screen.getByRole("button", {
      name: /Submit Assortment Plan/i,
    });
    fireEvent.click(submitBtn);

    expect(onSubmit).toHaveBeenCalledWith({
      scenario_code: "BALANCED",
      override_comments: null,
    });
  });
});
