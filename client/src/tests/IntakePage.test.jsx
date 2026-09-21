import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";
import IntakePage from "../pages/IntakePage.jsx";

describe("IntakePage Component", () => {
  it("renders intake registration form fields", () => {
    render(
      <BrowserRouter>
        <IntakePage />
      </BrowserRouter>,
    );

    expect(
      screen.getByText(/Inmate Booking & Intake Registration/i),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Marcus/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Vance/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/XXX-XX-XXXX/i)).toBeInTheDocument();
  });

  it("autofills test data when button is clicked", () => {
    render(
      <BrowserRouter>
        <IntakePage />
      </BrowserRouter>,
    );

    const autofillBtn = screen.getByText(/Autofill Test Data/i);
    fireEvent.click(autofillBtn);

    const firstNameInput = screen.getByPlaceholderText(/e\.g\. Marcus/i);
    expect(firstNameInput.value).toBe("Marcus");
  });
});
