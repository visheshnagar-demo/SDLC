import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FDAdviceReceiptCard from "../components/FDAdviceReceiptCard";

describe("FDAdviceReceiptCard Component", () => {
  const mockFD = {
    id: "fd_12345",
    account_number: "FD-987654",
    deposit_amount: 5000,
    interest_rate: 5.5,
    maturity_amount: 5275,
    maturity_date: "Oct 8, 2027",
    status: "ACTIVE",
  };

  const mockReceipt = {
    receipt_number: "REC-FD-9941",
    download_url:
      "http://localhost:8000/api/v1/fixed-deposits/fd_12345/receipt",
  };

  const mockAccount = {
    account_number: "XXXX-1234",
    account_type: "Primary Savings",
  };

  it("renders success screen and certificate details", () => {
    render(
      <FDAdviceReceiptCard
        fixedDeposit={mockFD}
        receipt={mockReceipt}
        sourceAccount={mockAccount}
      />,
    );

    expect(
      screen.getByText(/Fixed Deposit Opened Successfully!/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/FD-987654/i)).toBeInTheDocument();
    expect(screen.getByText(/\$5,000.00/i)).toBeInTheDocument();
    expect(screen.getByText(/5.50% p.a./i)).toBeInTheDocument();
    expect(screen.getByText(/Oct 8, 2027/i)).toBeInTheDocument();
    expect(screen.getByText(/\$5,275.00/i)).toBeInTheDocument();
  });

  it("handles download advice button click", () => {
    window.open = vi.fn();
    render(
      <FDAdviceReceiptCard
        fixedDeposit={mockFD}
        receipt={mockReceipt}
        sourceAccount={mockAccount}
      />,
    );

    const downloadBtn = screen.getByRole("button", {
      name: /Download Digital Advice PDF/i,
    });
    fireEvent.click(downloadBtn);
    expect(window.open).toHaveBeenCalledWith(
      mockReceipt.download_url,
      "_blank",
    );
  });
});
