import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ReadinessGauge from "../components/releases/ReadinessGauge";

describe("ReadinessGauge Component", () => {
  it("renders readiness percentage score and risk badge", () => {
    const readinessData = {
      total_items: 10,
      completed_items: 8,
      readiness_percentage: 80,
      unresolved_blockers: 0,
      risk_level: "LOW",
      is_ready_for_deployment: false,
    };

    render(<ReadinessGauge readiness={readinessData} />);

    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("Release Readiness Score")).toBeInTheDocument();
    expect(screen.getByText("8 / 10")).toBeInTheDocument();
    expect(screen.getByText("Risk: LOW")).toBeInTheDocument();
  });

  it("shows blocker alert warning when unresolved blockers exist", () => {
    const blockedData = {
      total_items: 5,
      completed_items: 3,
      readiness_percentage: 60,
      unresolved_blockers: 2,
      risk_level: "HIGH",
      is_ready_for_deployment: false,
    };

    render(<ReadinessGauge readiness={blockedData} />);

    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("Risk: HIGH")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("GATED")).toBeInTheDocument();
  });
});
