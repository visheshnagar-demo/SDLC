import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import Dashboard from "../Dashboard";

vi.mock("../../services/api", () => ({
  getDashboardMetrics: vi.fn().mockResolvedValue({
    total_circulation: 5000000,
    active_accounts: 1500,
    low_stock_count: 1,
    volume_24h: 250000,
    recent_transactions: [
      {
        id: "tx-12345678",
        transaction_type: "TRANSFER",
        amount: 500,
        status: "COMPLETED",
        reason: "Test transfer",
        created_at: new Date().toISOString(),
      },
    ],
  }),
}));

describe("Dashboard Component", () => {
  it("renders dashboard heading and KPI cards", async () => {
    render(<Dashboard onOpenTransfer={() => {}} />);

    expect(screen.getByText(/ChipsLedger Pro Dashboard/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("5,000,000")).toBeInTheDocument();
      expect(screen.getByText("1,500")).toBeInTheDocument();
      expect(screen.getByText("250,000")).toBeInTheDocument();
    });
  });

  it("renders recent transactions table", async () => {
    render(<Dashboard onOpenTransfer={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("TRANSFER")).toBeInTheDocument();
      expect(screen.getByText("500")).toBeInTheDocument();
      expect(screen.getByText("COMPLETED")).toBeInTheDocument();
    });
  });
});
