import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import AuditPage from "../pages/AuditPage";

describe("AuditPage", () => {
  it("renders immutable audit trail header and export button", () => {
    render(
      <BrowserRouter>
        <AuditPage />
      </BrowserRouter>,
    );

    expect(
      screen.getByText("Immutable Audit Trail & Compliance Ledger"),
    ).toBeInTheDocument();
    expect(screen.getByText("Export Regulatory Report")).toBeInTheDocument();
  });
});
