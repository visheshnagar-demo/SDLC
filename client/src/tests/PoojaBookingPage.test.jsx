import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PoojaBookingPage from "../pages/PoojaBookingPage";

describe("PoojaBookingPage", () => {
  it("renders pooja catalog and booking desk", () => {
    render(<PoojaBookingPage />);
    expect(
      screen.getByText(/Pooja & Archana Booking Desk/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Mahaganapati Homa/i)[0]).toBeInTheDocument();
  });
});
