import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";
import MovementsPage from "../pages/MovementsPage.jsx";

describe("MovementsPage Component", () => {
  it("renders movement dispatch form and headcount table", () => {
    render(
      <BrowserRouter>
        <MovementsPage />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Dispatch Inmate Movement/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Facility Headcount Reconciliation by Unit/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Active Movements & 30-Min Watchdog Queue/i),
    ).toBeInTheDocument();
  });
});
