import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { DashboardPage } from "../pages/DashboardPage";

describe("DashboardPage", () => {
  it("renders overview header and KPI section", () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <DashboardPage />
        </BrowserRouter>
      </AuthProvider>,
    );

    expect(screen.getByText(/Herd Overview & Analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Herd Count/i)).toBeInTheDocument();
    expect(screen.getByText(/Today's Milk Yield/i)).toBeInTheDocument();
  });
});
