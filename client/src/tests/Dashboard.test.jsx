import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import Dashboard from "../pages/Dashboard";

vi.mock("../services/api", () => ({
  api: {
    getDashboardAnalytics: vi.fn().mockResolvedValue({
      occupancy_rate_percentage: 85.0,
      total_rooms: 50,
      occupied_rooms: 42,
      available_rooms: 8,
      maintenance_rooms: 0,
      today_revenue: 15200.0,
      pending_check_ins_today: 12,
      pending_check_outs_today: 6,
    }),
    getRooms: vi.fn().mockResolvedValue([
      {
        id: "1",
        room_number: "101",
        room_category: "Standard",
        base_rate_per_night: 120,
        status: "Available",
      },
      {
        id: "2",
        room_number: "102",
        room_category: "Deluxe",
        base_rate_per_night: 180,
        status: "Occupied",
      },
    ]),
    getBookings: vi
      .fn()
      .mockResolvedValue([
        {
          id: "b1",
          guest_name: "John Doe",
          room_number: "102",
          total_nights: 2,
          booking_status: "Confirmed",
        },
      ]),
    updateRoomStatus: vi.fn().mockResolvedValue({ status: "success" }),
  },
}));

describe("Dashboard Component", () => {
  it("renders the operations dashboard heading and key KPI stat cards", async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    expect(screen.getByText("Operations Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Occupancy Rate")).toBeInTheDocument();
    expect(screen.getByText("Today Revenue")).toBeInTheDocument();
    expect(screen.getByText("Pending Check-Ins")).toBeInTheDocument();
    expect(screen.getByText("Pending Check-Outs")).toBeInTheDocument();
  });

  it("renders the room status grid section", async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );

    expect(screen.getByText("Live Room Status Grid")).toBeInTheDocument();
    expect(screen.getByText("Front Desk Queue & Alerts")).toBeInTheDocument();
  });
});
