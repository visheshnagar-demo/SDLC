import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LoanManager from "../components/LoanManager";

describe("LoanManager Component", () => {
  const mockArtifacts = [
    {
      id: "art-1",
      accession_no: "ART-2026-085",
      title: "Bronze Statue of Hermes",
      status: "On Display",
    },
  ];

  const mockLoans = [
    {
      id: "loan-1",
      artifact_id: "art-1",
      artifact_title: "Bronze Statue of Hermes",
      partner_museum_name: "Metropolitan Art Institute",
      contact_person: "Sarah Jenkins",
      contact_email: "loans@metmuseum.org",
      loan_start_date: "2026-08-01",
      loan_end_date: "2026-12-15",
      indemnity_valuation: 500000,
      transit_requirements:
        "Climate-controlled courier transit (18-22°C, 45-55% RH).",
      loan_status: "In Transit",
    },
    {
      id: "loan-2",
      artifact_id: "art-1",
      partner_museum_name: "British Museum, London",
      contact_person: "David Sterling",
      contact_email: "loans@britishmuseum.org",
      loan_start_date: "2026-10-01",
      loan_end_date: "2027-04-01",
      indemnity_valuation: 320000,
      transit_requirements: "Archival crate with buffer silica gel.",
      loan_status: "Requested",
    },
  ];

  it("renders 5-stage kanban pipeline headers", () => {
    render(<LoanManager loans={mockLoans} artifacts={mockArtifacts} />);

    expect(
      screen.getByText(/Inter-Museum Loan Pipeline & Agreement Registry/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Requested/i)).toBeInTheDocument();
    expect(screen.getByText(/Approved/i)).toBeInTheDocument();
    expect(screen.getByText(/In Transit/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Loan/i)).toBeInTheDocument();
    expect(screen.getByText(/Returned/i)).toBeInTheDocument();
  });

  it("triggers status advancement when action button is clicked", () => {
    const handleUpdate = vi
      .fn()
      .mockResolvedValue({ id: "loan-2", loan_status: "Approved" });
    render(
      <LoanManager
        loans={mockLoans}
        artifacts={mockArtifacts}
        onUpdateLoanStatus={handleUpdate}
      />,
    );

    const approveBtn = screen.getByRole("button", {
      name: /Review & Approve/i,
    });
    fireEvent.click(approveBtn);

    expect(handleUpdate).toHaveBeenCalledWith(
      "loan-2",
      expect.objectContaining({
        loan_status: "Approved",
      }),
    );
  });
});
