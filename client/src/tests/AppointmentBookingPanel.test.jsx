import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AuthProvider } from "../context/AuthContext";
import AppointmentBookingPanel from "../components/patient/AppointmentBookingPanel";

describe("AppointmentBookingPanel", () => {
  it("renders booking panel controls, doctor selector, and slot grid", () => {
    render(
      <AuthProvider>
        <AppointmentBookingPanel />
      </AuthProvider>,
    );

    expect(screen.getByText(/Book Doctor Consultation/i)).toBeInTheDocument();
    expect(screen.getByText(/Department \/ Specialty/i)).toBeInTheDocument();
    expect(screen.getByText(/Reason for Visit/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Confirm & Book Appointment/i }),
    ).toBeInTheDocument();
  });
});
