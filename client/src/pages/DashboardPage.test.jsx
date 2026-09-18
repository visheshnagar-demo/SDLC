import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import DashboardPage from "./DashboardPage";

vi.mock("../services/api", () => ({
  getDashboardAnalytics: vi.fn().mockResolvedValue({
    total_revenue: 1250.0,
    total_orders: 15,
    total_flowers_in_stock: 1200,
    low_stock_count: 2,
    top_selling_flowers: [],
  }),
  getFlowers: vi.fn().mockResolvedValue([]),
  getOrders: vi.fn().mockResolvedValue([]),
}));

describe("DashboardPage Component", () => {
  it("renders dashboard header and stat cards", async () => {
    render(
      <BrowserRouter>
        <DashboardPage onOpenCreateOrder={() => {}} />
      </BrowserRouter>,
    );

    expect(screen.getByText("Florist Executive Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Daily Revenue")).toBeInTheDocument();
  });
});
