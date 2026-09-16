import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./App.jsx";

// Mock API service calls
vi.mock("./services/api.js", () => ({
  setAuthUserHeader: vi.fn(),
  createWire: vi.fn(),
  getPendingWires: vi.fn().mockResolvedValue([
    {
      id: "wire-101",
      beneficiaryName: "ACME Corp Holdings",
      accountNumber: "987654321",
      routingNumber: "121000358",
      amount: 15000,
      status: "PENDING",
      createdBy: "User A (Maker)",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]),
  approveWire: vi.fn(),
  rejectWire: vi.fn(),
  default: {
    defaults: {
      headers: {
        common: {},
      },
    },
  },
}));

describe("Commercial Wire Maker-Checker Banking Dashboard", () => {
  it("renders Apex Commercial Bank header title", async () => {
    render(<App />);
    const titleElements = await screen.findAllByText(/Apex Commercial Bank/i);
    expect(titleElements.length).toBeGreaterThan(0);
  });

  it("renders Active Role selector with User A (Maker)", async () => {
    render(<App />);
    const roleSelector = await screen.findByRole("combobox", {
      name: /Active Role/i,
    });
    expect(roleSelector).toBeInTheDocument();
    expect(roleSelector.value).toBe("User A (Maker)");
  });

  it("renders Wire Initiation Form fields", async () => {
    render(<App />);
    expect(
      await screen.findByLabelText(/Beneficiary Name/i),
    ).toBeInTheDocument();
    expect(await screen.findByLabelText(/Account Number/i)).toBeInTheDocument();
    expect(
      await screen.findByLabelText(/ABA Routing Number/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByLabelText(/Transfer Amount/i),
    ).toBeInTheDocument();
  });

  it("renders Pending Approval Queue table", async () => {
    render(<App />);
    const queueHeadings = await screen.findAllByText(/Pending Approval Queue/i);
    expect(queueHeadings.length).toBeGreaterThan(0);
  });
});
