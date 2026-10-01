import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import EmrWorkspace from "../components/EmrWorkspace";

describe("EmrWorkspace Component", () => {
  const mockPatient = {
    id: "p-101",
    first_name: "Eleanor",
    last_name: "Pena",
  };

  it("renders SOAP Note editor sections and diagnosis input", () => {
    render(
      <EmrWorkspace
        patient={mockPatient}
        currentUser={{ username: "Dr. Sarah Smith", role: "DOCTOR" }}
      />,
    );

    expect(screen.getByText(/Clinical SOAP Note Editor/i)).toBeInTheDocument();
    expect(screen.getByText(/\[S\] Subjective/i)).toBeInTheDocument();
    expect(screen.getByText(/\[O\] Objective/i)).toBeInTheDocument();
    expect(screen.getByText(/\[A\] Assessment/i)).toBeInTheDocument();
    expect(screen.getByText(/\[P\] Plan/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign & Seal Note/i)).toBeInTheDocument();
  });
});
