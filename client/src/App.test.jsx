import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./App.jsx";

vi.mock("./services/api.js", () => ({
  getPendingWires: vi.fn().mockResolvedValue([
    {
      id: "WR-1001",
      beneficiaryName: "Acme Corp",
      accountNumber: "1234567890",
      routingNumber: "987654321",
      amount: 15000,
      status: "PENDING",
      createdBy: "User A",
      approvedBy: null,
    },
  ]),
  getAllWires: vi.fn().mockResolvedValue([
    {
      id: "WR-1001",
      beneficiaryName: "Acme Corp",
      accountNumber: "1234567890",
      routingNumber: "987654321",
      amount: 15000,
      status: "PENDING",
      createdBy: "User A",
      approvedBy: null,
    },
  ]),
  createWire: vi.fn(),
  approveWire: vi.fn(),
  rejectWire: vi.fn(),
}));

describe("Commercial Wire Maker-Checker App", () => {
  it("renders header and core dashboard elements", async () => {
    render(<App />);

    expect(screen.getByText(/Commercial Bank Treasury/i)).toBeInDocument();
    expect(screen.getByText(/Active Session:/i)).toBeInDocument();
    expect(
      screen.getByText(/Initiate Commercial Wire Transfer/i),
    ).toBeInDocument();
  });

  it("displays user switcher with User A and User B options", () => {
    render(<App />);

    const select = screen.getByRole("combobox", { name: /Select User Role/i });
    expect(select).toBeInDocument();
    expect(screen.getByText(/User A \(Maker\)/i)).toBeInDocument();
    expect(screen.getByText(/User B \(Checker\)/i)).toBeInDocument();
  });
});
