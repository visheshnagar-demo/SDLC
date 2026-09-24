import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import RuleEnginePage from "../pages/RuleEnginePage";
import * as api from "../services/api";

vi.mock("../services/api");

describe("RuleEnginePage", () => {
  const mockRules = [
    {
      id: "rule-1",
      name: "High Transaction Amount Threshold",
      rule_type: "AMOUNT_THRESHOLD",
      description: "Flags single transactions exceeding threshold limit.",
      severity: "HIGH",
      is_active: true,
      parameters: { threshold_amount: 10000 },
    },
    {
      id: "rule-2",
      name: "High-Frequency Velocity",
      rule_type: "FREQUENCY_VELOCITY",
      description: "Flags rapid bursts of transactions within rolling window.",
      severity: "CRITICAL",
      is_active: true,
      parameters: { window_seconds: 600, max_count: 5 },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    api.getRules.mockResolvedValue(mockRules);
  });

  it("renders the rule engine page and configured rules", async () => {
    render(
      <MemoryRouter>
        <RuleEnginePage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Dynamic Detection Rules & Thresholds/i),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("High Transaction Amount Threshold"),
      ).toBeInTheDocument();
      expect(screen.getByText("High-Frequency Velocity")).toBeInTheDocument();
      expect(screen.getAllByText(/Save Rule Changes/i).length).toBe(2);
    });
  });
});
