import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SavingsAccountSelector from "../components/SavingsAccountSelector";

describe("SavingsAccountSelector Component", () => {
  const mockAccounts = [
    {
      id: "acc_1",
      account_number: "XXXX-1234",
      account_type: "Primary Savings",
      available_balance: 10000,
      is_eligible_for_fd: true,
      status: "ACTIVE",
    },
    {
      id: "acc_2",
      account_number: "XXXX-5678",
      account_type: "Secondary Savings",
      available_balance: 250,
      is_eligible_for_fd: false,
      ineligibility_reason: "Insufficient balance (< $500 min)",
      status: "ACTIVE",
    },
  ];

  it("renders funding accounts list and balance details", () => {
    render(
      <SavingsAccountSelector
        accounts={mockAccounts}
        selectedAccountId="acc_1"
        onSelectAccount={vi.fn()}
        onProceed={vi.fn()}
      />,
    );

    expect(screen.getByText(/Select Funding Account/i)).toBeInTheDocument();
    expect(screen.getByText(/Primary Savings/i)).toBeInTheDocument();
    expect(screen.getByText(/Available: \$10,000.00/i)).toBeInTheDocument();
    expect(screen.getByText(/Eligible for FD/i)).toBeInTheDocument();
  });

  it("disables ineligible account selection", () => {
    const onSelectMock = vi.fn();
    render(
      <SavingsAccountSelector
        accounts={mockAccounts}
        selectedAccountId="acc_1"
        onSelectAccount={onSelectMock}
        onProceed={vi.fn()}
      />,
    );

    expect(screen.getByText(/Insufficient balance/i)).toBeInTheDocument();
    const ineligibleRadio = screen.getAllByRole("radio")[1];
    expect(ineligibleRadio).toBeDisabled();
  });

  it("calls onProceed when proceed button is clicked", () => {
    const onProceedMock = vi.fn();
    render(
      <SavingsAccountSelector
        accounts={mockAccounts}
        selectedAccountId="acc_1"
        onSelectAccount={vi.fn()}
        onProceed={onProceedMock}
      />,
    );

    const proceedBtn = screen.getByRole("button", {
      name: /Proceed to Choose Plan/i,
    });
    expect(proceedBtn).toBeEnabled();
    fireEvent.click(proceedBtn);
    expect(onProceedMock).toHaveBeenCalled();
  });
});
