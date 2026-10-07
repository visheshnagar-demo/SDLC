import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App";

describe("App Root Integration", () => {
  it("renders application brand header and navigation elements", () => {
    render(<App />);
    expect(screen.getByText(/MediCare Core/i)).toBeInTheDocument();
    expect(screen.getByText(/HIPAA Encrypted/i)).toBeInTheDocument();
    expect(screen.getByText(/Patient Care Portal/i)).toBeInTheDocument();
  });
});
