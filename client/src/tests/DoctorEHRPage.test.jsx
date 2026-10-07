import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import DoctorEHRPage from "../pages/DoctorEHRPage";

describe("DoctorEHRPage", () => {
  it("renders physician clinical workspace with patient banner and SOAP tabs", () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <DoctorEHRPage />
        </BrowserRouter>
      </AuthProvider>,
    );

    expect(
      screen.getByText(/Physician Clinical & EHR Workspace/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Current Consultation Encounter \(SOAP\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/CRITICAL ALLERGIES & ALERTS/i),
    ).toBeInTheDocument();
  });
});
