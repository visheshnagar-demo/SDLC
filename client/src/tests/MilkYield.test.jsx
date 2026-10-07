import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { MilkYieldPage } from "../pages/MilkYieldPage";

describe("MilkYieldPage", () => {
  it("renders milking log form and logs table", () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <MilkYieldPage />
        </BrowserRouter>
      </AuthProvider>,
    );

    expect(
      screen.getByText(/Milk Production & Yield Logging/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Record Daily Milking Session/i),
    ).toBeInTheDocument();
  });
});
