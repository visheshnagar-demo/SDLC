import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import EHRWorkspace from "../components/ehr/EHRWorkspace.jsx";

describe("EHRWorkspace Component", () => {
  it("renders patient banner with allergy warning and vitals flowsheet", () => {
    render(<EHRWorkspace onEncounterClosed={vi.fn()} />);
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText(/Allergy: Penicillin/i)).toBeInTheDocument();
    expect(screen.getByText(/Patient Vitals Flowsheet/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Chief Complaint/i)).toBeInTheDocument();
  });

  it("renders ICD-10 diagnosis codes and prescriptions table", () => {
    render(<EHRWorkspace onEncounterClosed={vi.fn()} />);
    expect(screen.getByText("ICD-10 Diagnoses")).toBeInTheDocument();
    expect(screen.getByText("I10")).toBeInTheDocument();
    expect(screen.getByText("Lisinopril")).toBeInTheDocument();
    expect(
      screen.getByText("Comprehensive Metabolic Panel (CMP)"),
    ).toBeInTheDocument();
  });
});
