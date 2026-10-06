import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PatientIntakeForm from "../components/patient/PatientIntakeForm.jsx";

describe("PatientIntakeForm Component", () => {
  it("renders initial demographic form fields and steps", () => {
    render(<PatientIntakeForm onPatientCreated={vi.fn()} />);
    expect(
      screen.getByText("1. Personal Information & Demographics"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
  });

  it("navigates through steps on Continue click", () => {
    render(<PatientIntakeForm onPatientCreated={vi.fn()} />);
    const continueBtn = screen.getByText("Continue");
    fireEvent.click(continueBtn);
    expect(
      screen.getByText("2. Emergency Contact Information"),
    ).toBeInTheDocument();
  });
});
