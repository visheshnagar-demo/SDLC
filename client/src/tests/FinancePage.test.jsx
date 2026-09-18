import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import FinancePage from "../pages/FinancePage";

describe("FinancePage", () => {
  it("renders financial accounting and shift reconcile dashboard", () => {
    render(<FinancePage />);
    expect(
      screen.getByText(/Financial Accounting & Audit Dashboard/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Total Daily Collections/i)).toBeInTheDocument();
  });
});
