import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import DashboardPage from "../pages/DashboardPage";

describe("DashboardPage Component", () => {
  it("renders KPI cards and hospital overview banner", async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    expect(
      screen.getByText(/Hospital Management & Clinical Overview/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Total Registered Patients/i)).toBeInTheDocument();
    expect(screen.getByText(/Today's Appointments/i)).toBeInTheDocument();
  });
});
