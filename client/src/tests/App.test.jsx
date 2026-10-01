import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "../App";

describe("Hospital Management System - App Root Component", () => {
  it("mounts and renders main hospital portal layout without crashing", () => {
    render(<App />);
    expect(screen.getByText(/HealthCare Core/i)).toBeInTheDocument();
  });

  it("renders navigation items", () => {
    render(<App />);
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Patients/i)).toBeInTheDocument();
    expect(screen.getByText(/Appointments/i)).toBeInTheDocument();
    expect(screen.getByText(/Medical Records/i)).toBeInTheDocument();
  });
});
