import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import InlineAuditBanner from "./InlineAuditBanner.jsx";

const mockAuditData = {
  audit_id: "AUD-20260518-001",
  submitted_at: "2026-05-18T10:30:00Z",
  manager_id: "MGR-8842",
  scenario_applied: "Balanced",
  total_sku_actions: 21,
  guardrails: [
    {
      name: "Private Brand Share ≥ 25.0%",
      passed: true,
      actual_value: "29.5%",
    },
  ],
  status: "APPROVED",
  message:
    "Assortment plan successfully submitted for Small Town Value Cluster.",
};

describe("InlineAuditBanner Component", () => {
  it("renders audit-trail confirmation banner details", () => {
    render(<InlineAuditBanner auditData={mockAuditData} />);

    expect(
      screen.getByText(/Plan Approved & Staged for POG Distribution/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Audit ID: AUD-20260518-001/i)).toBeInTheDocument();
    expect(screen.getByText(/MGR-8842/i)).toBeInTheDocument();
    expect(screen.getByText(/21 SKU actions queued/i)).toBeInTheDocument();
  });

  it("opens and closes certificate modal", () => {
    render(<InlineAuditBanner auditData={mockAuditData} />);

    const certBtn = screen.getByText("View Certificate");
    fireEvent.click(certBtn);

    expect(
      screen.getByText("Assortment Plan Audit Certificate"),
    ).toBeInTheDocument();

    const closeBtn = screen.getByText("Close Certificate");
    fireEvent.click(closeBtn);

    expect(
      screen.queryByText("Assortment Plan Audit Certificate"),
    ).not.toBeInTheDocument();
  });

  it("renders nothing when auditData is null", () => {
    const { container } = render(<InlineAuditBanner auditData={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
