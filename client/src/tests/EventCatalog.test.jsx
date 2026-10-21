import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import EventCatalog from "../pages/EventCatalog";
import { AuthProvider } from "../context/AuthContext";

vi.mock("../services/api", () => ({
  getEvents: vi.fn().mockResolvedValue([
    {
      id: "event-1",
      title: "Navratri Inaugural Night",
      description: "Opening Garba Night with live dandiya orchestra.",
      venue_name: "Grand Garba Dome, Ahmedabad",
      start_date: "2026-10-15T18:00:00Z",
      end_date: "2026-10-15T23:59:00Z",
      status: "Active",
    },
  ]),
  getEventTiers: vi.fn().mockResolvedValue([
    {
      id: "tier-1",
      tier_name: "VIP Season Pass",
      description: "All 9 nights access with VIP lounge.",
      price: 150.0,
      total_quota: 500,
      available_quota: 420,
    },
  ]),
  createBooking: vi.fn().mockResolvedValue({
    id: "booking-1",
    booking_reference: "GBK-9901",
    total_amount: 150.0,
    passes: [{ id: "pass-1", attendee_name: "Aarav Patel" }],
  }),
}));

describe("EventCatalog Page", () => {
  it("renders hero title and event options", async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <EventCatalog />
        </BrowserRouter>
      </AuthProvider>,
    );

    expect(screen.getByText(/Celebrate 9 Divine Nights/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/Navratri Inaugural Night/i),
    ).toBeInTheDocument();
  });
});
