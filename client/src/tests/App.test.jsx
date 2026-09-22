import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "../App";

describe("App smoke tests", () => {
  it("renders the main app without crashing", () => {
    render(<App />);
    expect(screen.getAllByText(/CHRONO CERTIFIED/i).length).toBeGreaterThan(0);
  });
});
