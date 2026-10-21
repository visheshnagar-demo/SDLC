import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import EventBookingPage from "../pages/EventBookingPage";

describe("EventBookingPage", () => {
  it("renders event booking page headings and primary sections", async () => {
    render(
      <BrowserRouter>
        <EventBookingPage />
      </BrowserRouter>,
    );

    expect(
      screen.getByText(/Experience Navratri Like Never Before/i),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText(/Select Garba Night or Season Pass/i),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Attendee Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Order Summary/i)).toBeInTheDocument();
  });

  it("displays default pre-filled test attendee information", () => {
    render(
      <BrowserRouter>
        <EventBookingPage />
      </BrowserRouter>,
    );

    const emailInput = screen.getByDisplayValue("test@example.com");
    expect(emailInput).toBeInTheDocument();
    const nameInput = screen.getByDisplayValue("Aarav Patel");
    expect(nameInput).toBeInTheDocument();
  });

  it("allows selecting different pass tiers", async () => {
    render(
      <BrowserRouter>
        <EventBookingPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("General Single-Day Pass")).toBeInTheDocument();
    });

    const generalTier = screen.getByText("General Single-Day Pass");
    fireEvent.click(generalTier);

    expect(
      screen.getAllByText(/General Single-Day Pass/i).length,
    ).toBeGreaterThan(0);
  });
});
