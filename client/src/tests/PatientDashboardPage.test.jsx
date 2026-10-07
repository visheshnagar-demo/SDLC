import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import PatientDashboardPage from "../pages/PatientDashboardPage";

describe("PatientDashboardPage", () => {
  it("renders patient care portal welcome banner, KPIs, and booking section", () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <PatientDashboardPage />
        </BrowserRouter>
      </AuthProvider>,
    );

    expect(screen.getByText(/Patient Care Portal/i)).toBeInTheDocument();
    expect(screen.getByText(/Next Appointment/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Prescriptions/i)).toBeInTheDocument();
    expect(screen.getByText(/HIPAA Data Vault/i)).toBeInTheDocument();
  });
});
