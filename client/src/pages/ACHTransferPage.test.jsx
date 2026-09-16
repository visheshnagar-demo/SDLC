import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ACHTransferPage from "./ACHTransferPage";

describe("ACHTransferPage", () => {
  it("renders dashboard heading and rules summary cards", () => {
    render(<ACHTransferPage />);
    expect(
      screen.getByText(/ACH Velocity Limits Dashboard/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Normal Approval/i)).toBeInTheDocument();
    expect(screen.getByText(/AML Review Flag/i)).toBeInTheDocument();
    expect(screen.getByText(/Velocity Rejection/i)).toBeInTheDocument();
  });
});
