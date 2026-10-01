import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import AppointmentScheduler from "../components/AppointmentScheduler";

describe("AppointmentScheduler Component", () => {
  const mockPatients = [
    { id: "p-101", first_name: "Eleanor", last_name: "Pena" },
  ];

  it("renders 30-min schedule slots and concurrency lock banner", () => {
    render(<AppointmentScheduler patients={mockPatients} appointments={[]} />);

    expect(
      screen.getByText(/Doctor Availability & Time Slots/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/09:00 AM/i)).toBeInTheDocument();
    expect(screen.getByText(/10:00 AM/i)).toBeInTheDocument();
    expect(screen.getByText(/Concurrency Lock Active:/i)).toBeInTheDocument();
  });
});
