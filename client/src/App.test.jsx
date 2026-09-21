import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App";
import { Dashboard } from "./pages/Dashboard";
import { Flocks } from "./pages/Flocks";
import { EggCollections } from "./pages/EggCollections";
import { FeedInventory } from "./pages/FeedInventory";
import { HealthLogs } from "./pages/HealthLogs";
import { BrowserRouter } from "react-router-dom";

// Mock API service calls to keep unit tests isolated and fast
vi.mock("./services/api", () => ({
  getFlocks: vi.fn().mockResolvedValue([
    {
      id: "flock-1",
      name: "Flock A-101",
      breed: "Rhode Island Red",
      hatch_date: "2025-01-10",
      initial_count: 500,
      active_count: 500,
      coop_location: "Coop #1",
      status: "Active",
    },
  ]),
  createFlock: vi.fn().mockResolvedValue({ id: "flock-2" }),
  deactivateFlock: vi.fn().mockResolvedValue({ status: "Archived" }),
  getEggCollections: vi.fn().mockResolvedValue([
    {
      id: "egg-1",
      flock_id: "flock-1",
      flock_name: "Flock A-101",
      collection_date: "2026-05-18",
      session: "Morning",
      grade_large: 400,
      grade_medium: 40,
      grade_small: 10,
      damaged: 0,
      total_count: 450,
    },
  ]),
  createEggCollection: vi.fn().mockResolvedValue({ id: "egg-2" }),
  getFeedInventory: vi.fn().mockResolvedValue([
    {
      id: "feed-1",
      feed_type: "Layer Mash",
      quantity_kg: 500.0,
      reorder_threshold_kg: 100.0,
    },
  ]),
  createFeedInventory: vi.fn().mockResolvedValue({ id: "feed-2" }),
  getFeedLogs: vi.fn().mockResolvedValue([]),
  logFeedConsumption: vi.fn().mockResolvedValue({ id: "flog-1" }),
  getHealthLogs: vi.fn().mockResolvedValue([]),
  createHealthLog: vi.fn().mockResolvedValue({ id: "hlog-1" }),
  getDashboardAnalytics: vi.fn().mockResolvedValue({
    total_active_flocks: 1,
    total_active_hens: 500,
    today_egg_total: 450,
    overall_laying_rate_pct: 90.0,
    low_stock_alerts: 0,
    recent_health_events_count: 0,
  }),
}));

describe("Hens Management System Frontend Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders main App without crashing and displays header brand", async () => {
    render(<App />);
    expect(screen.getByText("Hens Central")).toBeInTheDocument();
    expect(screen.getByText("Farm Operations Dashboard")).toBeInTheDocument();
  });

  it("renders Dashboard component with key KPI metrics", async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("Active Hens")).toBeInTheDocument();
      expect(screen.getByText("Today's Egg Yield")).toBeInTheDocument();
      expect(screen.getByText("Feed Stock Status")).toBeInTheDocument();
    });
  });

  it("renders Flocks page and opens Register Flock Modal", async () => {
    render(
      <BrowserRouter>
        <Flocks />
      </BrowserRouter>,
    );
    await waitFor(() => {
      expect(
        screen.getByText("Flock Registry & Management"),
      ).toBeInTheDocument();
    });

    const registerBtn = screen.getByRole("button", {
      name: /Register New Flock/i,
    });
    fireEvent.click(registerBtn);

    expect(
      screen.getByRole("heading", { name: "Register New Flock" }),
    ).toBeInTheDocument();
  });

  it("renders Egg Collections page with logger form", async () => {
    render(
      <BrowserRouter>
        <EggCollections />
      </BrowserRouter>,
    );
    await waitFor(() => {
      expect(
        screen.getByText("Daily Egg Collection & Quality Grading"),
      ).toBeInTheDocument();
      expect(screen.getByText("Quality Grade Breakdown")).toBeInTheDocument();
    });
  });

  it("renders Feed Inventory page", async () => {
    render(
      <BrowserRouter>
        <FeedInventory />
      </BrowserRouter>,
    );
    await waitFor(() => {
      expect(
        screen.getByText("Feed Inventory & Consumption Tracking"),
      ).toBeInTheDocument();
    });
  });

  it("renders Health Logs page", async () => {
    render(
      <BrowserRouter>
        <HealthLogs />
      </BrowserRouter>,
    );
    await waitFor(() => {
      expect(
        screen.getByText("Flock Health, Vaccination & Mortality Logs"),
      ).toBeInTheDocument();
      expect(screen.getByText("Record Health Event")).toBeInTheDocument();
    });
  });
});
