import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import AppointmentsPage from "../pages/AppointmentsPage";

describe("AppointmentsPage Component", () => {
  it("renders outpatient booking portal and appointment tracker", () => {
    render(
      <BrowserRouter>
        <AppointmentsPage />
      </BrowserRouter>,
    );

    expect(
      screen.getByText(/Outpatient Appointment Booking & Workflow Manager/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Outpatient Appointment Booking Portal/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Reservation Summary/i)).toBeInTheDocument();
  });
});
