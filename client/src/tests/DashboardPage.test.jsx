import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import DashboardPage from "../pages/DashboardPage";

describe("DashboardPage", () => {
  it("renders control center title and KPI cards", () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("ChipsLedger Control Center")).toBeInTheDocument();
    expect(screen.getByText("Total Circulation")).toBeInTheDocument();
    expect(screen.getByText("Active Balances")).toBeInTheDocument();
  });
});
