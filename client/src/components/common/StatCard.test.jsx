import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import StatCard from "./StatCard";

describe("StatCard Component", () => {
  it("renders title, value, and subtitle correctly", () => {
    render(
      <StatCard
        title="Daily Revenue"
        value="$1,250.00"
        subtitle="Total sales"
      />,
    );

    expect(screen.getByText("Daily Revenue")).toBeInTheDocument();
    expect(screen.getByText("$1,250.00")).toBeInTheDocument();
    expect(screen.getByText("Total sales")).toBeInTheDocument();
  });
});
