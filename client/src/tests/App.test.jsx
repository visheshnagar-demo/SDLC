import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import DashboardPage from "../pages/DashboardPage";
import { MemoryRouter } from "react-router-dom";

// Mock API module
vi.mock("../services/api", () => ({
  getDashboardAnalytics: vi.fn().mockResolvedValue({
    total_flowers: 12,
    low_stock_count: 2,
    total_orders: 5,
    total_revenue: 450.0,
  }),
  getFlowers: vi.fn().mockResolvedValue([
    {
      id: "fl-1",
      name: "Red Rose",
      species: "Rosa rubiginosa",
      color: "Red",
      price_per_stem: 2.5,
      stock_quantity: 100,
      low_stock_threshold: 20,
    },
  ]),
  getOrders: vi.fn().mockResolvedValue([
    {
      id: "ord-1",
      order_number: "ORD-1001",
      customer_name: "Jane Doe",
      status: "Completed",
      total_amount: 150.0,
      items: [],
    },
  ]),
  getSuppliers: vi.fn().mockResolvedValue([]),
  getCategories: vi.fn().mockResolvedValue([]),
  createOrder: vi.fn().mockResolvedValue({ id: "ord-2" }),
  updateOrderStatus: vi.fn().mockResolvedValue({ id: "ord-1" }),
}));

describe("Flowers Management System - Dashboard", () => {
  it("renders store overview and analytics heading", async () => {
    render(
      <MemoryRouter>
        <DashboardPage onOpenCreateOrder={vi.fn()} />
      </MemoryRouter>,
    );
    expect(
      await screen.findByText(/Store Overview & Analytics/i),
    ).toBeInTheDocument();
  });
});
