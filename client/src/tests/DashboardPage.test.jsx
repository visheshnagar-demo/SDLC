import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import DashboardPage from "../pages/DashboardPage";

describe("DashboardPage", () => {
  it("renders dashboard overview title without throwing", async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );
    expect(
      await screen.findByText(/Rainwater Harvesting Overview/i),
    ).toBeInTheDocument();
  });

  it("displays KPI cards and tank telemetry sections", async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );
    expect(
      await screen.findByText(/Total Harvested Storage/i),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Water Quality Index/i)).toBeInTheDocument();
  });
});
