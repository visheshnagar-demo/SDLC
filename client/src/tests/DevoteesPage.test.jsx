import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import DevoteesPage from "../pages/DevoteesPage";

describe("DevoteesPage", () => {
  it("renders devotee directory header and devotee table", () => {
    render(<DevoteesPage />);
    expect(screen.getByText(/Devotee Directory/i)).toBeInTheDocument();
    expect(screen.getByText(/Ramesh Sharma/i)).toBeInTheDocument();
  });
});
