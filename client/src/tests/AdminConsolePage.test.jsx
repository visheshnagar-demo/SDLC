import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import AdminConsolePage from "../pages/AdminConsolePage";

describe("AdminConsolePage", () => {
  it("renders hospital administration console and audit trail stream", () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <AdminConsolePage />
        </BrowserRouter>
      </AuthProvider>,
    );

    expect(
      screen.getByText(/Hospital Administration & HIPAA Security Console/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Master Patient Index/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/SSN Verification Rate/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Patient Master Directory & SSN Resolution/i),
    ).toBeInTheDocument();
  });
});
