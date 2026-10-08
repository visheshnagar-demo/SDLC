import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthProvider } from "../context/AuthContext";
import AppointmentBookingPanel, {
  formatSlotTime,
} from "../components/patient/AppointmentBookingPanel";

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

  it("formats ISO timestamps and HH:MM time strings into readable AM/PM strings", () => {
    expect(formatSlotTime("2026-10-15T09:00:00Z")).toBe("09:00 AM");
    expect(formatSlotTime("2026-10-15T09:30:00Z")).toBe("09:30 AM");
    expect(formatSlotTime("2026-10-15T14:00:00Z")).toBe("02:00 PM");
    expect(formatSlotTime("2026-10-15T16:30:00Z")).toBe("04:30 PM");
    expect(formatSlotTime("09:00")).toBe("09:00 AM");
    expect(formatSlotTime("09:30")).toBe("09:30 AM");
    expect(formatSlotTime("14:00")).toBe("02:00 PM");
    expect(formatSlotTime("12:00")).toBe("12:00 PM");
    expect(formatSlotTime("")).toBe("");
  });
});
