import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import InventoryManager from "../InventoryManager";

vi.mock("../../services/api", () => ({
  getChips: vi.fn().mockResolvedValue([
    {
      id: "chip-1111",
      name: "Gold 100",
      category: "STANDARD",
      face_value: 100,
      status: "ACTIVE",
      total_quantity: 10000,
      available_quantity: 8000,
      allocated_quantity: 2000,
      batches: [
        {
          id: "batch-1",
          batch_number: "B-001",
          total_quantity: 10000,
          available_quantity: 8000,
        },
      ],
    },
  ]),
  createChip: vi
    .fn()
    .mockResolvedValue({ id: "chip-2222", name: "Platinum 1000" }),
  addInventoryBatch: vi.fn().mockResolvedValue({ id: "batch-2" }),
  updateChipStatus: vi.fn().mockResolvedValue({ status: "SUSPENDED" }),
}));

describe("InventoryManager Component", () => {
  it("renders inventory header and chip items", async () => {
    render(<InventoryManager />);

    expect(
      screen.getByText(/Chip Inventory & Vault Stock/i),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Gold 100")).toBeInTheDocument();
      expect(screen.getByText("$100.00")).toBeInTheDocument();
      expect(screen.getByText("B-001")).toBeInTheDocument();
    });
  });

  it("opens modal to create new chip type", async () => {
    render(<InventoryManager />);

    const createBtn = screen.getByText(/Create New Chip Type/i);
    fireEvent.click(createBtn);

    expect(screen.getByText(/Save Chip Definition/i)).toBeInTheDocument();
  });
});
