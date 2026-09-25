import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FeedingPage from "../pages/FeedingPage";
import FeedingChecklist from "../components/feeding/FeedingChecklist";
import * as api from "../services/api";

vi.mock("../services/api", () => ({
  getTanks: vi.fn(),
  getFeedingSchedules: vi.fn(),
  getFeedingLogs: vi.fn(),
  createFeedingLog: vi.fn(),
  createFeedingSchedule: vi.fn(),
}));

describe("Feeding Management Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getTanks.mockResolvedValue([
      { id: "tank-1", name: "Tank 1 - Reef", water_type: "Saltwater" },
    ]);
    api.getFeedingSchedules.mockResolvedValue([
      {
        id: "sched-1",
        tank_id: "tank-1",
        food_type: "Marine Micro-Pellets",
        portion_grams: 15,
        frequency: "Daily",
        scheduled_time: "08:00 AM",
        is_active: true,
      },
    ]);
    api.getFeedingLogs.mockResolvedValue([
      {
        id: "log-1",
        tank_id: "tank-1",
        food_type: "Marine Micro-Pellets",
        portion_grams: 15,
        fed_by: "Dr. Elena Rostova",
        fed_at: "2026-09-25T08:05:00Z",
        notes: "Fed enthusiastically",
      },
    ]);
  });

  it("renders FeedingChecklist with schedule items", () => {
    const schedules = [
      {
        id: "s1",
        food_type: "Spirulina Flakes",
        portion_grams: 10,
        scheduled_time: "09:00 AM",
        frequency: "Daily",
      },
    ];
    render(
      <FeedingChecklist schedules={schedules} logs={[]} onQuickLog={vi.fn()} />,
    );

    expect(
      screen.getByText(/Today's Feeding Timeline & Checklist/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Spirulina Flakes \(10g\)/i)).toBeInTheDocument();
    expect(screen.getByText("09:00 AM")).toBeInTheDocument();
  });

  it("renders FeedingPage and displays timeline, schedule table, and manual logging form", async () => {
    render(
      <MemoryRouter>
        <FeedingPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Feeding Schedules & Nutrition Logistics/i),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Log Manual Feeding Event/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Configured Feeding Schedules/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Historical Feeding Execution Logs/i),
      ).toBeInTheDocument();
    });
  });
});
