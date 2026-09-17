import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import TransferModal from "../TransferModal";

vi.mock("../../services/api", () => ({
  getChips: vi
    .fn()
    .mockResolvedValue([
      { id: "c1", name: "Gold 100", face_value: 100, available_quantity: 5000 },
    ]),
  getAccounts: vi.fn().mockResolvedValue([
    { id: "a1", owner_name: "Alice", account_number: "ACC-1" },
    { id: "a2", owner_name: "Bob", account_number: "ACC-2" },
  ]),
  transferChips: vi.fn().mockResolvedValue({ id: "tx-999" }),
  allocateChips: vi.fn().mockResolvedValue({ id: "tx-888" }),
  redeemChips: vi.fn().mockResolvedValue({ id: "tx-777" }),
}));

describe("TransferModal Component", () => {
  it("does not render when closed", () => {
    const { container } = render(
      <TransferModal isOpen={false} onClose={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal with mode options when open", async () => {
    render(
      <TransferModal isOpen={true} onClose={() => {}} initialMode="transfer" />,
    );

    expect(screen.getByText(/Chip Transaction Terminal/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Confirm TRANSFER/i)).toBeInTheDocument();
    });
  });
});
