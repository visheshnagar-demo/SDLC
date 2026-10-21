import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import GateScanner from "../pages/GateScanner";
import { AuthProvider } from "../context/AuthContext";

vi.mock("../services/api", () => ({
  validateGatePass: vi.fn().mockResolvedValue({
    status: "VALID",
    message: "Pass successfully verified.",
    attendeeName: "Aarav Patel",
    passNumber: "GP-88321",
    tierName: "VIP Pass",
    checkedInAt: new Date().toISOString(),
  }),
}));

describe("GateScanner Page", () => {
  it("renders scanner heading and optical viewport", () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <GateScanner />
        </BrowserRouter>
      </AuthProvider>,
    );

    expect(screen.getByText(/Real-Time Entry Scanner/i)).toBeInTheDocument();
    expect(screen.getByText(/Gate Optical Scanner/i)).toBeInTheDocument();
    expect(screen.getByText(/Manual Token Entry/i)).toBeInTheDocument();
  });
});
