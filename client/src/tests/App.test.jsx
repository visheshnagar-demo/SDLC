import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "../App";

describe("App Component", () => {
  it("renders the top navigation and CuratorGuard branding", async () => {
    render(<App />);
    const brandElements = screen.getAllByText(/CuratorGuard/i);
    expect(brandElements.length).toBeGreaterThanOrEqual(1);
    expect(brandElements[0]).toBeInTheDocument();

    const subElements = screen.getAllByText(/Museum Artifact Preservation/i);
    expect(subElements.length).toBeGreaterThanOrEqual(1);

    expect(
      screen.getByRole("button", { name: /Dashboard/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Artifact Catalog/i }),
    ).toBeInTheDocument();
  });

  it("switches tabs when clicking on navigation buttons", async () => {
    render(<App />);
    const catalogTab = screen.getByRole("button", {
      name: /Artifact Catalog/i,
    });
    fireEvent.click(catalogTab);
    expect(
      screen.getByText(/Artifact Catalog & Accession Registry/i),
    ).toBeInTheDocument();

    const restorationsTab = screen.getByRole("button", {
      name: /Conservation Journal/i,
    });
    fireEvent.click(restorationsTab);
    expect(
      screen.getByText(/Conservation Journal & Immutable Treatment Ledger/i),
    ).toBeInTheDocument();

    const inspectionsTab = screen.getByRole("button", { name: /Inspections/i });
    fireEvent.click(inspectionsTab);
    expect(
      screen.getByText(
        /Physical Inspection Scheduling & Preservation Audit Queue/i,
      ),
    ).toBeInTheDocument();

    const loansTab = screen.getByRole("button", { name: /Loan Management/i });
    fireEvent.click(loansTab);
    expect(
      screen.getByText(/Inter-Museum Loan Pipeline & Agreement Registry/i),
    ).toBeInTheDocument();
  });
});
