import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CellHousingGrid from "../components/housing/CellHousingGrid";

vi.mock("../services/api", () => ({
  getCells: vi
    .fn()
    .mockResolvedValue([
      {
        id: "c1",
        cell_number: "A-101",
        block_name: "Block A",
        capacity: 2,
        current_occupancy: 1,
        security_tier: "MINIMUM",
      },
    ]),
  getInmates: vi
    .fn()
    .mockResolvedValue([
      {
        id: "i1",
        inmate_number: "INM-1001",
        first_name: "Jane",
        last_name: "Smith",
        security_tier: "MINIMUM",
      },
    ]),
  assignCell: vi.fn().mockResolvedValue({ message: "Assigned successfully" }),
}));

describe("CellHousingGrid Component", () => {
  it("renders housing matrix title and cell control panel", async () => {
    render(<CellHousingGrid />);
    expect(
      await screen.findByText(/CELL HOUSING & CAPACITY MANAGEMENT MATRIX/i),
    ).toBeInView();
    expect(screen.getByText(/CELL ASSIGNMENT CONTROL PANEL/i)).toBeInView();
  });

  it("renders cell items from API", async () => {
    render(<CellHousingGrid />);
    expect(await screen.findByText("A-101")).toBeInView();
  });
});
