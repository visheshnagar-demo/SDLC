import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Users } from "lucide-react";
import StatCard from "../components/common/StatCard.jsx";

describe("StatCard Component", () => {
  it("renders label, value and change indicator", () => {
    render(
      <StatCard
        label="Active Patients"
        value="1,248"
        change="+5.2%"
        icon={Users}
      />,
    );

    expect(screen.getByText("Active Patients")).toBeInTheDocument();
    expect(screen.getByText("1,248")).toBeInTheDocument();
    expect(screen.getByText("+5.2%")).toBeInTheDocument();
  });

  it("renders subtext when provided", () => {
    render(
      <StatCard
        label="Pending Invoices"
        value="$18,450"
        subtext="9 claims in queue"
      />,
    );

    expect(screen.getByText("Pending Invoices")).toBeInTheDocument();
    expect(screen.getByText("$18,450")).toBeInTheDocument();
    expect(screen.getByText("9 claims in queue")).toBeInTheDocument();
  });
});
