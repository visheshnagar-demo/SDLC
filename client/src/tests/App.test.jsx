import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import App from "../App";

describe("App Component", () => {
  it("renders without throwing and displays brand name", () => {
    render(<App />);
    expect(screen.getByText(/GarbaFest/i)).toBeInTheDocument();
  });
});
