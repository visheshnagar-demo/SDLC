import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "../App.jsx";

describe("App Component", () => {
  it("renders JMS Enterprise navbar and default Intake Page", () => {
    render(<App />);
    expect(screen.getAllByText(/JMS Enterprise/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Inmate Intake & Booking Dashboard/i),
    ).toBeInTheDocument();
  });
});
