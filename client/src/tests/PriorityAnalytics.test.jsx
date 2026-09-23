import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PriorityDirectiveList from "../components/PriorityDirectiveList";
import WorkloadAnalyticsChart from "../components/WorkloadAnalyticsChart";
import MemoryRetentionGraph from "../components/MemoryRetentionGraph";

describe("PriorityDirectiveList Component", () => {
  const mockPriorities = [
    {
      id: "p1",
      subject_id: "s1",
      subject_name: "Quantum Mechanics",
      priority_rank: 1,
      urgency_score: 95,
      recommendation_text: "Target problem sets early in the morning.",
    },
  ];

  it("renders ranked priority item", () => {
    render(
      <PriorityDirectiveList
        priorities={mockPriorities}
        subjects={[{ id: "s1", name: "Quantum Mechanics" }]}
      />,
    );

    expect(screen.getByText("Quantum Mechanics")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText(/Target problem sets/i)).toBeInTheDocument();
    expect(screen.getByText(/Urgency: 95%/i)).toBeInTheDocument();
  });

  it("renders empty state when no priorities", () => {
    render(<PriorityDirectiveList priorities={[]} subjects={[]} />);
    expect(
      screen.getByText(/No Priority Recommendations Yet/i),
    ).toBeInTheDocument();
  });
});

describe("Analytics Charts", () => {
  it("renders WorkloadAnalyticsChart without crashing", () => {
    render(<WorkloadAnalyticsChart subjects={[]} sessions={[]} />);
    expect(
      screen.getByText(/Workload Distribution & Hours Allocation/i),
    ).toBeInTheDocument();
  });

  it("renders MemoryRetentionGraph without crashing", () => {
    render(<MemoryRetentionGraph />);
    expect(screen.getByText(/Memory Retention Forecast/i)).toBeInTheDocument();
  });
});
