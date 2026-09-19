import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";
import ChannelsPage from "../pages/ChannelsPage";

vi.mock("../services/api", () => ({
  channelsApi: {
    getChannels: vi.fn().mockResolvedValue([
      {
        id: "ch-1",
        name: "Global News HD",
        code: "GNN-HD",
        stream_url: "udp://239.1.1.1:5000",
        resolution: "1080p60",
        language: "EN",
        status: "ACTIVE",
        is_live: true,
      },
    ]),
    createChannel: vi.fn().mockResolvedValue({}),
    updateChannel: vi.fn().mockResolvedValue({}),
    deleteChannel: vi.fn().mockResolvedValue({}),
  },
  programsApi: {
    getPrograms: vi.fn().mockResolvedValue([
      {
        id: "prg-1",
        title: "Morning Global Bulletin",
        category: "News",
        description: "Daily news bulletin",
        default_duration_minutes: 60,
        host_name: "Sarah",
        is_recurring: true,
      },
    ]),
    createProgram: vi.fn().mockResolvedValue({}),
    updateProgram: vi.fn().mockResolvedValue({}),
    deleteProgram: vi.fn().mockResolvedValue({}),
  },
}));

describe("ChannelsPage Component", () => {
  it("renders channel management console header and action buttons", async () => {
    render(
      <MemoryRouter>
        <ChannelsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Channel & Program Management Console/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/\+ Register New Channel/i)).toBeInTheDocument();
  });
});
