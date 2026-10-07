import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import Guests from "../pages/Guests";

vi.mock("../services/api", () => ({
  api: {
    getGuests: vi
      .fn()
      .mockResolvedValue([
        {
          id: "g1",
          full_name: "Eleanor Vance",
          email: "eleanor@example.com",
          phone_number: "555-1234",
          vip_status: true,
        },
      ]),
    getRooms: vi
      .fn()
      .mockResolvedValue([
        {
          id: "r1",
          room_number: "101",
          room_category: "Standard",
          base_rate_per_night: 120,
          status: "Available",
        },
      ]),
    createGuest: vi
      .fn()
      .mockResolvedValue({ id: "g2", full_name: "New Guest" }),
    createBooking: vi.fn().mockResolvedValue({ id: "b1" }),
    checkInGuest: vi.fn().mockResolvedValue({ status: "success" }),
  },
}));

describe("Guests Component", () => {
  it("renders guest directory and check-in processing terminal", () => {
    render(
      <BrowserRouter>
        <Guests />
      </BrowserRouter>,
    );

    expect(
      screen.getByText("Guest Directory & Front-Desk Check-In"),
    ).toBeInTheDocument();
    expect(screen.getByText("Guest Directory")).toBeInTheDocument();
    expect(
      screen.getByText("Front-Desk Check-In Terminal"),
    ).toBeInTheDocument();
  });
});
