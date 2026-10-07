import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { HealthRecordsPage } from "../pages/HealthRecordsPage";

describe("HealthRecordsPage", () => {
  it("renders health events page and action triggers", () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <HealthRecordsPage />
        </BrowserRouter>
      </AuthProvider>,
    );

    expect(
      screen.getByText(/Health & Veterinary Event Tracking/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/\+ Record Medical Event/i)).toBeInTheDocument();
  });
});
