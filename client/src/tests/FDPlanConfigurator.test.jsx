import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FDPlanConfigurator from "../components/FDPlanConfigurator";

describe("FDPlanConfigurator Component", () => {
  const mockAccount = {
    id: "acc_1",
    account_number: "XXXX-1234",
    account_type: "Primary Savings",
    available_balance: 10000,
  };

  const mockPlans = [
    {
      tenure_months: 6,
      interest_rate: 4.75,
      min_deposit: 500,
      label: "6 Months",
    },
    {
      tenure_months: 12,
      interest_rate: 5.5,
      min_deposit: 500,
      label: "12 Months",
      is_recommended: true,
    },
    {
      tenure_months: 24,
      interest_rate: 5.8,
      min_deposit: 500,
      label: "24 Months",
    },
    {
      tenure_months: 36,
      interest_rate: 6.0,
      min_deposit: 500,
      label: "36 Months",
    },
  ];

  it("renders deposit amount input and tenure options", () => {
    render(
      <FDPlanConfigurator
        sourceAccount={mockAccount}
        ratePlans={mockPlans}
        depositAmount={5000}
        setDepositAmount={vi.fn()}
        tenureMonths={12}
        setTenureMonths={vi.fn()}
        payoutFrequency="maturity"
        setPayoutFrequency={vi.fn()}
        onProceed={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/Deposit Amount/i)).toBeInTheDocument();
    expect(screen.getByText(/12 Months/i)).toBeInTheDocument();
    expect(screen.getAllByText(/5.50% p.a./i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Calculation Summary/i)).toBeInTheDocument();
  });

  it("handles quick amount buttons", () => {
    const setDepositMock = vi.fn();
    render(
      <FDPlanConfigurator
        sourceAccount={mockAccount}
        ratePlans={mockPlans}
        depositAmount={5000}
        setDepositAmount={setDepositMock}
        tenureMonths={12}
        setTenureMonths={vi.fn()}
        payoutFrequency="maturity"
        setPayoutFrequency={vi.fn()}
        onProceed={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    const add1000Btn = screen.getByRole("button", { name: /\+\$1,000/i });
    fireEvent.click(add1000Btn);
    expect(setDepositMock).toHaveBeenCalledWith(6000);
  });

  it("shows validation error when deposit is below minimum", () => {
    render(
      <FDPlanConfigurator
        sourceAccount={mockAccount}
        ratePlans={mockPlans}
        depositAmount={200}
        setDepositAmount={vi.fn()}
        tenureMonths={12}
        setTenureMonths={vi.fn()}
        payoutFrequency="maturity"
        setPayoutFrequency={vi.fn()}
        onProceed={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/Minimum deposit amount is \$500/i),
    ).toBeInTheDocument();
  });
});
