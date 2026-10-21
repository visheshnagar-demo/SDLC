import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import PatientsPage from "../pages/PatientsPage";

describe("PatientsPage Component", () => {
  it("renders patient directory header and registration trigger", () => {
    render(
      <BrowserRouter>
        <PatientsPage />
      </BrowserRouter>,
    );

    expect(
      screen.getByText(/Patient Directory & Registration Portal/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Register New Patient/i }),
    ).toBeInTheDocument();
  });
});
