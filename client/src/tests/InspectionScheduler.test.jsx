import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import InspectionScheduler from "../components/InspectionScheduler";

describe("InspectionScheduler Component", () => {
  const mockArtifacts = [
    {
      id: "art-1",
      accession_no: "ART-2026-089",
      title: "Flemish Silk Tapestry Fragment",
    },
  ];

  const mockInspections = [
    {
      id: "insp-1",
      artifact_id: "art-1",
      assigned_inspector: "Dr. Eleanor Vance",
      scheduled_date: "2026-09-20",
      inspection_status: "Pending",
      surface_condition: "Minor Wear",
      pest_activity: false,
      structural_integrity: "Fragile",
      findings_notes:
        "Urgent check needed following Storage Vault A moisture excursion.",
    },
  ];

  it("renders priority inspection queue and audit checklist", () => {
    render(
      <InspectionScheduler
        inspections={mockInspections}
        artifacts={mockArtifacts}
      />,
    );

    expect(
      screen.getByText(
        /Physical Inspection Scheduling & Preservation Audit Queue/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Active Priority Queue & Overdue Audits/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Active Audit Checklist/i)).toBeInTheDocument();
    expect(screen.getByText(/Calculated Next Inspection/i)).toBeInTheDocument();
  });

  it("submits inspection checklist findings", () => {
    const handleComplete = vi.fn().mockResolvedValue({ id: "insp-1" });
    render(
      <InspectionScheduler
        inspections={mockInspections}
        artifacts={mockArtifacts}
        onCompleteInspection={handleComplete}
      />,
    );

    const submitBtn = screen.getByRole("button", {
      name: /Submit Inspection Audit Report/i,
    });
    fireEvent.click(submitBtn);

    expect(handleComplete).toHaveBeenCalled();
  });
});
