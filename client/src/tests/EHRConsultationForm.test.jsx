import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthProvider } from "../context/AuthContext";
import EHRConsultationForm from "../components/doctor/EHRConsultationForm";

describe("EHRConsultationForm", () => {
  it("renders vitals monitor strip, SOAP notes, and prescription builder", () => {
    render(
      <AuthProvider>
        <EHRConsultationForm patientId="pat-9921" />
      </AuthProvider>,
    );

    expect(
      screen.getByText(/Point-of-Care Vitals Monitor Strip/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Physician SOAP Encounter Notes/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/E-Prescription Order Builder/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Diagnostic Laboratory Orders/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Save & Finalize Clinical Encounter/i,
      }),
    ).toBeInTheDocument();
  });
});
