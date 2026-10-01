import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PatientBanner from "../components/PatientBanner";

describe("PatientBanner Component", () => {
  const mockPatient = {
    id: "p-test-12345",
    first_name: "Eleanor",
    last_name: "Pena",
    date_of_birth: "1985-06-14",
    gender: "FEMALE",
    phone: "+1 (555) 382-9102",
    insurance_info: {
      provider: "Blue Cross Blue Shield",
      allergies: "Penicillin (Severe Anaphylaxis Risk)",
      blood_type: "O+",
    },
  };

  it("renders patient name, MRN, and demographics", () => {
    render(<PatientBanner patient={mockPatient} />);

    expect(screen.getByText("Eleanor Pena")).toBeInTheDocument();
    expect(screen.getByText(/MRN:/i)).toBeInTheDocument();
    expect(screen.getByText("O+")).toBeInTheDocument();
  });

  it("renders prominent Penicillin allergy warning alert", () => {
    render(<PatientBanner patient={mockPatient} />);

    expect(
      screen.getByText(/Critical Clinical Allergy Alert/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Penicillin \(Severe Anaphylaxis Risk\)/i),
    ).toBeInTheDocument();
  });

  it("renders fallback message when no patient is selected", () => {
    render(<PatientBanner patient={null} />);
    expect(
      screen.getByText(/No patient currently selected/i),
    ).toBeInTheDocument();
  });
});
