import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ApprovalQueueTable from "../ApprovalQueueTable";

describe("ApprovalQueueTable Component", () => {
  it("renders empty state when pending wires array is empty", () => {
    render(
      <ApprovalQueueTable
        pendingWires={[]}
        currentUser="User B (Checker)"
        onApprove={() => {}}
        onReject={() => {}}
        onRefresh={() => {}}
        isLoading={false}
      />,
    );

    expect(screen.getByText(/No Pending Wire Transfers/i)).toBeInTheDocument();
  });

  it("renders table rows and triggers approve and reject actions", () => {
    const mockWires = [
      {
        id: "wire-1234-5678",
        beneficiaryName: "Globex Corp",
        accountNumber: "999888777",
        routingNumber: "111222333",
        amount: 25000,
        status: "PENDING",
        createdBy: "User A (Maker)",
      },
    ];

    const handleApprove = vi.fn();
    const handleReject = vi.fn();

    render(
      <ApprovalQueueTable
        pendingWires={mockWires}
        currentUser="User B (Checker)"
        onApprove={handleApprove}
        onReject={handleReject}
        onRefresh={() => {}}
        isLoading={false}
      />,
    );

    expect(screen.getByText("Globex Corp")).toBeInTheDocument();
    expect(screen.getByText(/User A \(Maker\)/i)).toBeInTheDocument();

    const approveBtn = screen.getByRole("button", { name: /Approve/i });
    const rejectBtn = screen.getByRole("button", { name: /Reject/i });

    fireEvent.click(approveBtn);
    expect(handleApprove).toHaveBeenCalledWith("wire-1234-5678");

    fireEvent.click(rejectBtn);
    expect(handleReject).toHaveBeenCalledWith("wire-1234-5678");
  });
});
