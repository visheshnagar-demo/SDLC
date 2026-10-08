import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FDOpeningPage from "../pages/FDOpeningPage";

vi.mock("../services/api", () => ({
  getSavingsAccounts: vi.fn().mockResolvedValue([
    {
      id: "acc_1",
      account_number: "XXXX-1234",
      account_type: "Primary Savings",
      available_balance: 10000,
      is_eligible_for_fd: true,
      status: "ACTIVE",
    },
  ]),
  getFixedDepositRates: vi.fn().mockResolvedValue({
    plans: [
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
    ],
    projection: {
      deposit_amount: 5000,
      tenure_months: 12,
      interest_rate: 5.5,
      total_interest_earned: 275,
      maturity_amount: 5275,
      maturity_date: "Oct 8, 2027",
    },
  }),
  createFixedDeposit: vi.fn().mockResolvedValue({
    status: "SUCCESS",
    message: "Fixed Deposit created successfully",
    fixed_deposit: {
      id: "fd_123",
      account_number: "FD-987654",
      deposit_amount: 5000,
      interest_rate: 5.5,
      tenure_months: 12,
      maturity_amount: 5275,
      maturity_date: "Oct 8, 2027",
      source_account_id: "acc_1",
      status: "ACTIVE",
    },
    receipt: {
      receipt_number: "REC-FD-9941",
      download_url:
        "http://localhost:8000/api/v1/fixed-deposits/fd_123/receipt",
    },
  }),
  getFDReceipt: vi.fn().mockResolvedValue({
    receipt_number: "REC-FD-9941",
    download_url: "http://localhost:8000/api/v1/fixed-deposits/fd_123/receipt",
  }),
}));

describe("FDOpeningPage Integration Wizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("navigates through complete wizard: account selection -> plan configuration -> PIN authorization -> confirmation", async () => {
    render(<FDOpeningPage />);

    // Step 1: Account Selection
    await waitFor(() => {
      expect(screen.getByText(/Primary Savings/i)).toBeInTheDocument();
    });

    const proceedToPlanBtn = screen.getByRole("button", {
      name: /Proceed to Choose Plan/i,
    });
    fireEvent.click(proceedToPlanBtn);

    // Step 2: Plan Configuration
    await waitFor(() => {
      expect(screen.getByText(/Configure Deposit/i)).toBeInTheDocument();
      expect(screen.getByText(/Calculation Summary/i)).toBeInTheDocument();
    });

    const proceedToReviewBtn = screen.getByRole("button", {
      name: /Proceed to Review & Authorize/i,
    });
    fireEvent.click(proceedToReviewBtn);

    // Step 3: Authorization & PIN Modal
    await waitFor(() => {
      expect(screen.getByText(/Review & Authorize/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Enter 4-Digit Transaction PIN/i),
      ).toBeInTheDocument();
    });

    // Use Biometric / Demo PIN
    const bioBtn = screen.getByRole("button", { name: /Use Biometric/i });
    fireEvent.click(bioBtn);

    const submitBtn = screen.getByRole("button", {
      name: /Confirm & Open Fixed Deposit/i,
    });
    expect(submitBtn).toBeEnabled();
    fireEvent.click(submitBtn);

    // Step 4: Confirmation Screen
    await waitFor(() => {
      expect(
        screen.getByText(/Fixed Deposit Opened Successfully!/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/FD-987654/i)).toBeInTheDocument();
    });
  });
});
