import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import DoctorsPage from "../pages/DoctorsPage";

describe("DoctorsPage Component", () => {
  it("renders doctor specialty roster and shift manager title", () => {
    render(<DoctorsPage />);

    expect(
      screen.getByText(/Doctor Schedules & Specialty Roster/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Select Physician to Manage Schedule/i),
    ).toBeInTheDocument();
  });
});
