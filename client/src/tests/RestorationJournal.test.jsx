import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import RestorationJournal from "../components/RestorationJournal";

describe("RestorationJournal Component", () => {
  const mockArtifacts = [
    {
      id: "art-1",
      accession_no: "ART-2026-001",
      title: "Roman Terracotta Amphora",
    },
  ];

  const mockRestorations = [
    {
      id: "res-1",
      artifact_id: "art-1",
      artifact_title: "Roman Terracotta Amphora",
      artifact_accession: "ART-2026-001",
      conservator_name: "Dr. Eleanor Vance",
      treatment_date: "2026-09-24",
      technique: "Structural Stabilization & Desalination",
      materials_used: "Micro-crystalline wax, Paraloid B-72",
      condition_before: "Fair",
      condition_after: "Stable",
      assessment_notes: "Structural consolidation completed.",
    },
  ];

  it("renders treatment history and immutable record form", () => {
    render(
      <RestorationJournal
        restorations={mockRestorations}
        artifacts={mockArtifacts}
      />,
    );

    expect(
      screen.getByText(/Conservation Journal & Immutable Treatment Ledger/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Treatment History & Audit Trail/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Record New Treatment/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Structural Stabilization & Desalination/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Dr. Eleanor Vance/i)).toBeInTheDocument();
  });

  it("submits a new treatment record", () => {
    const handleCreate = vi.fn().mockResolvedValue({ id: "res-new" });
    render(
      <RestorationJournal
        restorations={mockRestorations}
        artifacts={mockArtifacts}
        onCreateRestoration={handleCreate}
      />,
    );

    const submitBtn = screen.getByRole("button", {
      name: /Commit Immutable Treatment Log/i,
    });
    fireEvent.click(submitBtn);

    expect(handleCreate).toHaveBeenCalled();
  });
});
