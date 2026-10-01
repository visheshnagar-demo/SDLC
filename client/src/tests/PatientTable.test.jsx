import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PatientTable from "../components/PatientTable";

describe("PatientTable Component", () => {
  const mockPatients = [
    {
      id: "p-001",
      first_name: "Eleanor",
      last_name: "Pena",
      date_of_birth: "1985-06-14",
      gender: "FEMALE",
      national_id: "987-65-4321",
      phone: "+1 (555) 382-9102",
      insurance_info: {
        provider: "Blue Cross Blue Shield",
        policy_number: "INS-99482",
      },
    },
    {
      id: "p-002",
      first_name: "Robert",
      last_name: "Fox",
      date_of_birth: "1972-11-03",
      gender: "MALE",
      national_id: "456-78-1234",
      phone: "+1 (555) 720-1945",
      insurance_info: {
        provider: "Medicare Advantage",
        policy_number: "MED-88124",
      },
    },
  ];

  it("renders patient directory rows and masked SSN", () => {
    render(<PatientTable patients={mockPatients} />);

    expect(screen.getByText("Eleanor Pena")).toBeInTheDocument();
    expect(screen.getByText("Robert Fox")).toBeInTheDocument();
    expect(screen.getByText("***-**-4321")).toBeInTheDocument();
    expect(screen.getByText("***-**-1234")).toBeInTheDocument();
  });

  it("renders empty state message when list is empty", () => {
    render(<PatientTable patients={[]} />);
    expect(screen.getByText(/No patient records found/i)).toBeInTheDocument();
  });
});
