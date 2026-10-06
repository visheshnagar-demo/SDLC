import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "../App.jsx";

// Mock API calls
vi.mock("../services/api.js", () => ({
  getActiveWithdrawals: vi.fn().mockResolvedValue([]),
  getDashboardAnalytics: vi.fn().mockResolvedValue({
    total_daily_yield: 2450.5,
    active_lactating_count: 100,
    fertility_rate: 68.0,
    feed_conversion_efficiency: 1.45,
  }),
  getFeedInventory: vi.fn().mockResolvedValue([]),
  getCattle: vi.fn().mockResolvedValue([]),
  getMilkLogs: vi.fn().mockResolvedValue([]),
  getBreedingRecords: vi.fn().mockResolvedValue([]),
  getHealthRecords: vi.fn().mockResolvedValue([]),
}));

describe("App Root Component", () => {
  it("renders Navbar with brand title", async () => {
    render(<App />);
    const brandElements = screen.getAllByText(/CattleCare/i);
    expect(brandElements.length).toBeGreaterThan(0);
    expect(brandElements[0]).toBeInTheDocument();
  });

  it("renders main dashboard page on default route", async () => {
    render(<App />);
    expect(
      await screen.findByText(/Dairy Herd Executive Dashboard/i),
    ).toBeInTheDocument();
  });
});
