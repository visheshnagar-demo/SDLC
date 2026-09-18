import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import DonationsPage from "../pages/DonationsPage";

describe("DonationsPage", () => {
  it("renders e-Hundi donation platform", () => {
    render(<DonationsPage />);
    expect(
      screen.getByText(/e-Hundi & Multi-Fund Donation Platform/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Offering Amount/i)).toBeInTheDocument();
  });
});
