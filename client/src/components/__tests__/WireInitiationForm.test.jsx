import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import WireInitiationForm from "../WireInitiationForm";

describe("WireInitiationForm Component", () => {
  it("renders form inputs and submit button", () => {
    render(
      <WireInitiationForm
        currentUser="User A (Maker)"
        onSubmitWire={() => {}}
        isLoading={false}
      />,
    );

    expect(screen.getByLabelText(/Beneficiary Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Account Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Routing Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Wire Amount/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Submit Wire Transfer/i }),
    ).toBeInTheDocument();
  });

  it("shows validation error when fields are empty on submit", () => {
    render(
      <WireInitiationForm
        currentUser="User A (Maker)"
        onSubmitWire={() => {}}
        isLoading={false}
      />,
    );

    const submitBtn = screen.getByRole("button", {
      name: /Submit Wire Transfer/i,
    });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/All fields are required/i)).toBeInTheDocument();
  });

  it("calls onSubmitWire with valid data", () => {
    const handleSubmit = vi.fn();
    render(
      <WireInitiationForm
        currentUser="User A (Maker)"
        onSubmitWire={handleSubmit}
        isLoading={false}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Beneficiary Name/i), {
      target: { value: "Acme Corp" },
    });
    fireEvent.change(screen.getByLabelText(/Account Number/i), {
      target: { value: "123456789" },
    });
    fireEvent.change(screen.getByLabelText(/Routing Number/i), {
      target: { value: "987654321" },
    });
    fireEvent.change(screen.getByLabelText(/Wire Amount/i), {
      target: { value: "15000" },
    });

    const submitBtn = screen.getByRole("button", {
      name: /Submit Wire Transfer/i,
    });
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit.mock.calls[0][0]).toEqual({
      beneficiaryName: "Acme Corp",
      accountNumber: "123456789",
      routingNumber: "987654321",
      amount: 15000,
      createdBy: "User A (Maker)",
    });
  });
});
