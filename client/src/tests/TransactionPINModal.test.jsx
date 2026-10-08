import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TransactionPINModal from "../components/TransactionPINModal";

describe("TransactionPINModal Component", () => {
  const mockAccount = {
    id: "acc_1",
    account_number: "XXXX-1234",
    account_type: "Primary Savings",
    available_balance: 10000,
  };

  it("renders order summary details correctly", () => {
    render(
      <TransactionPINModal
        sourceAccount={mockAccount}
        depositAmount={5000}
        tenureMonths={12}
        interestRate={5.5}
        payoutFrequency="maturity"
        maturityAmount={5275}
        onConfirm={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText(/Order Summary/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\$5,000.00/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/12 Months @ 5.50% p.a./i)).toBeInTheDocument();
    expect(screen.getByText(/\$5,275.00/i)).toBeInTheDocument();
  });

  it("populates PIN and confirms when biometric / demo PIN is clicked", () => {
    const onConfirmMock = vi.fn();
    render(
      <TransactionPINModal
        sourceAccount={mockAccount}
        depositAmount={5000}
        tenureMonths={12}
        interestRate={5.5}
        payoutFrequency="maturity"
        maturityAmount={5275}
        onConfirm={onConfirmMock}
        onBack={vi.fn()}
      />,
    );

    const biometricBtn = screen.getByRole("button", { name: /Use Biometric/i });
    fireEvent.click(biometricBtn);

    const confirmBtn = screen.getByRole("button", {
      name: /Confirm & Open Fixed Deposit Account/i,
    });
    expect(confirmBtn).toBeEnabled();
    fireEvent.click(confirmBtn);

    expect(onConfirmMock).toHaveBeenCalledWith("1234");
  });
});
