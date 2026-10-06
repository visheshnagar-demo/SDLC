import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import DashboardPage from "../pages/DashboardPage.jsx";

vi.mock("../services/api.js", () => ({
  getDashboardAnalytics: vi.fn().mockResolvedValue({
    total_daily_yield: 2450.5,
    active_lactating_count: 100,
    total_herd_count: 125,
    fertility_rate: 68.0,
    feed_conversion_efficiency: 1.45,
    active_withholding_count: 1,
  }),
  getActiveWithdrawals: vi.fn().mockResolvedValue([
    {
      id: "wh-1",
      cow_id: "COW-1042",
      diagnosis: "Mastitis Treatment - Antibiotic X",
      milk_withdrawal_end: "2026-05-22T08:00:00.000Z",
    },
  ]),
  getFeedInventory: vi.fn().mockResolvedValue([
    {
      id: "feed-1",
      feed_name: "Corn Silage",
      current_stock_kg: 8400,
      daily_consumption_kg: 1800,
      reorder_threshold_kg: 9000,
      reorder_alert: true,
    },
  ]),
}));

describe("DashboardPage Component", () => {
  it("renders dashboard header and key metrics", async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    expect(
      screen.getByText(/Dairy Herd Executive Dashboard/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Daily Milk Yield/i)).toBeInTheDocument();
    expect(screen.getByText(/Herd Pregnancy Rate/i)).toBeInTheDocument();
  });

  it("renders active withholding warning banner when cows are under withdrawal", async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    expect(
      await screen.findByText(/Active Milk Withholding Alert/i),
    ).toBeInTheDocument();
  });
});
