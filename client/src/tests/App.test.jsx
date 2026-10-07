import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App";

describe("App Root Component", () => {
  it("renders application navigation and layout successfully", () => {
    render(<App />);
    const brandElements = screen.getAllByText(/CattleTrack Pro/i);
    expect(brandElements.length).toBeGreaterThan(0);
    expect(brandElements[0]).toBeInTheDocument();
  });
});
