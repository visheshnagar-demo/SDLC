import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";
import SchedulePage from "../pages/SchedulePage";

vi.mock("../services/api", () => ({
  schedulesApi: {
    getSchedules: vi.fn().mockResolvedValue([]),
    createSchedule: vi.fn().mockResolvedValue({}),
    updateSchedule: vi.fn().mockResolvedValue({}),
    deleteSchedule: vi.fn().mockResolvedValue({}),
    triggerOverride: vi.fn().mockResolvedValue({}),
  },
  channelsApi: {
    getChannels: vi
      .fn()
      .mockResolvedValue([
        {
          id: "ch-1",
          name: "Global News HD",
          code: "GNN-HD",
          resolution: "1080p60",
        },
      ]),
  },
  programsApi: {
    getPrograms: vi
      .fn()
      .mockResolvedValue([
        { id: "prg-1", title: "Morning Bulletin", category: "News" },
      ]),
  },
}));

describe("SchedulePage Component", () => {
  it("renders rundown scheduler header and add slot button", async () => {
    render(
      <MemoryRouter>
        <SchedulePage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Broadcast & Playout Rundown Scheduler/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/\+ Add Program Slot/i).length).toBeGreaterThan(
      0,
    );
  });
});
