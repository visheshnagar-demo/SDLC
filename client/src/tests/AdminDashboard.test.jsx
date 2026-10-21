import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AdminDashboard from "../pages/AdminDashboard";
import { AuthProvider } from "../context/AuthContext";

vi.mock("../services/api", () => ({
  getLiveAnalytics: vi.fn().mockResolvedValue({
    totalPassesIssued: 4850,
    totalCheckedIn: 1250,
    scansPerMinute: 45.2,
    liveOccupancy: 1250,
    grossRevenue: 727500.0,
    gateMetrics: [
      {
        gateIdentifier: "GATE_1_NORTH",
        totalScans: 450,
        successfulScans: 430,
        blockedScans: 20,
      },
    ],
  }),
  getEvents: vi
    .fn()
    .mockResolvedValue([{ id: "event-1", title: "Navratri 2026" }]),
  getEventTiers: vi.fn().mockResolvedValue([
    {
      id: "tier-1",
      tier_name: "VIP Season Pass",
      price: 150.0,
      total_quota: 500,
      available_quota: 420,
    },
  ]),
  updatePassTier: vi.fn().mockResolvedValue({}),
  exportAttendeesCsv: vi.fn().mockResolvedValue(new Blob(["id,name\n1,Aarav"])),
}));

describe("AdminDashboard Page", () => {
  it("renders admin command center and metrics", async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      </AuthProvider>,
    );

    expect(
      screen.getByText(/Admin Analytics & Quota Controls/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Live Arena Occupancy/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Pass Quotas & Dynamic Pricing/i),
    ).toBeInTheDocument();
  });
});
