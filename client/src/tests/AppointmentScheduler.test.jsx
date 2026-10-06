import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AppointmentScheduler from "../components/appointment/AppointmentScheduler.jsx";

describe("AppointmentScheduler Component", () => {
  it("renders department selection, doctor selection, and time slot grid", () => {
    render(<AppointmentScheduler onAppointmentBooked={vi.fn()} />);
    expect(
      screen.getByText("Provider Schedule & Slot Reservation"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Department/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Doctor/i)).toBeInTheDocument();
    expect(
      screen.getByText("Available 30-Minute Time Slots"),
    ).toBeInTheDocument();
    expect(screen.getByText("10:00 AM")).toBeInTheDocument();
  });

  it("updates selected slot when clicking an available slot", () => {
    render(<AppointmentScheduler onAppointmentBooked={vi.fn()} />);
    const slotBtn = screen.getByText("10:30 AM");
    fireEvent.click(slotBtn);
    expect(screen.getByText(/Selected slot \(10:30 AM\)/i)).toBeInTheDocument();
  });
});
