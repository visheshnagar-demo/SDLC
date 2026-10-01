import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import RegistrationStepperForm from "../components/RegistrationStepperForm";

describe("RegistrationStepperForm Component", () => {
  const existingPatients = [
    {
      id: "p-existing-1",
      first_name: "Jane",
      last_name: "Doe",
      national_id: "123-45-6789",
    },
  ];

  it("renders demographic intake fields when open", () => {
    render(
      <RegistrationStepperForm
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        existingPatients={existingPatients}
      />,
    );

    expect(
      screen.getByText(/Patient Registration & Intake/i),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. John")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Doe")).toBeInTheDocument();
  });

  it("triggers real-time duplicate SSN warning banner when existing national_id is typed", () => {
    render(
      <RegistrationStepperForm
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        existingPatients={existingPatients}
      />,
    );

    const ssnInput = screen.getByPlaceholderText("e.g. 123-45-6789");
    fireEvent.change(ssnInput, { target: { value: "123-45-6789" } });

    expect(
      screen.getByText(/Existing Patient Profile Detected:/i),
    ).toBeInTheDocument();
  });
});
