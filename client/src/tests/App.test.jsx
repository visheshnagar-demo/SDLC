import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "../App";

describe("CarePulse OS App Shell & Navigation", () => {
  it("renders main application brand title and navigation items", () => {
    render(<App />);
    const brandElements = screen.getAllByText(/CarePulse OS/i);
    expect(brandElements.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Dashboard/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Patients/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Doctors & Schedules/i).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText(/Appointments/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Clinical EMR/i).length).toBeGreaterThan(0);
  });
});
