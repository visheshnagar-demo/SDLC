import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import AdminDashboardPage from "../pages/AdminDashboardPage";

describe("AdminDashboardPage", () => {
  it("renders KPI metric cards and admin tables", () => {
    render(<AdminDashboardPage />);

    expect(
      screen.getByText(/Admin & Live Attendance Analytics/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Passes Sold/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Arena Occupancy/i)).toBeInTheDocument();
    expect(screen.getByText(/Gross Revenue/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Pass Tier Quota & Dynamic Pricing Controls/i),
    ).toBeInTheDocument();
  });

  it("filters attendees when searching", () => {
    render(<AdminDashboardPage />);

    const searchInput = screen.getByPlaceholderText(
      /Search name, email, pass.../i,
    );
    fireEvent.change(searchInput, { target: { value: "Priya" } });

    expect(screen.getByText("Priya Shah")).toBeInTheDocument();
  });
});
