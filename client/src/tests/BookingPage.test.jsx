import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import BookingPage from "../pages/BookingPage";
import { AuthProvider } from "../context/AuthContext";

vi.mock("../services/api", () => ({
  getEvents: vi.fn().mockResolvedValue([]),
  getEventTiers: vi.fn().mockResolvedValue([]),
  createBooking: vi.fn().mockResolvedValue({}),
}));

describe("BookingPage", () => {
  it("renders booking page container without throwing", () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <BookingPage />
        </BrowserRouter>
      </AuthProvider>,
    );

    expect(
      screen.getByText(/GarbaFest 2026 Registration/i),
    ).toBeInTheDocument();
  });
});
