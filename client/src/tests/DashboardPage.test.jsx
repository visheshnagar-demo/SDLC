import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import DashboardPage from "../pages/DashboardPage.jsx";

describe("DashboardPage Component", () => {
  it("renders dashboard stat cards, appointments table, and quick actions", () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Active Patients")).toBeInTheDocument();
    expect(screen.getByText("Today's Appointment Queue")).toBeInTheDocument();
    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    expect(screen.getByText("Clinical Activity Feed")).toBeInTheDocument();
  });
});
