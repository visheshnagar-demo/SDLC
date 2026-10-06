import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import BillingPortal from "../components/billing/BillingPortal.jsx";

describe("BillingPortal Component", () => {
  it("renders invoice stats and invoice list table", () => {
    render(<BillingPortal onPaymentProcessed={vi.fn()} />);
    expect(screen.getByText("Total Outstanding")).toBeInTheDocument();
    expect(screen.getByText("INV-5001")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Invoice #INV-5001 Details")).toBeInTheDocument();
    expect(screen.getByText("Itemized CPT Services")).toBeInTheDocument();
  });

  it("filters invoice tabs on click", () => {
    render(<BillingPortal onPaymentProcessed={vi.fn()} />);
    const paidTab = screen.getByRole("button", { name: "Paid" });
    fireEvent.click(paidTab);
    expect(screen.getByText("INV-5002")).toBeInTheDocument();
  });
});
