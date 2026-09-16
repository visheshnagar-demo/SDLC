import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App";
import * as api from "./services/api";

vi.mock("./services/api", () => ({
  createWire: vi.fn(),
  getPendingWires: vi.fn(),
  getAllWires: vi.fn(),
  approveWire: vi.fn(),
  rejectWire: vi.fn(),
}));

describe("Commercial Wire Maker-Checker System App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getPendingWires.mockResolvedValue([
      {
        id: "wire-123",
        beneficiaryName: "Acme Corp",
        accountNumber: "1234567890",
        routingNumber: "021000021",
        amount: 15000,
        status: "PENDING",
        createdBy: "User A",
      },
    ]);
    api.getAllWires.mockResolvedValue([
      {
        id: "wire-123",
        beneficiaryName: "Acme Corp",
        accountNumber: "1234567890",
        routingNumber: "021000021",
        amount: 15000,
        status: "PENDING",
        createdBy: "User A",
      },
    ]);
  });

  it("renders Apex Commercial Bank header and User Switcher", async () => {
    render(<App />);

    expect(screen.getByText("Apex Commercial Bank")).toBeInTheDocument();
    expect(
      screen.getByText("Commercial Wire Maker-Checker System"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Switch User Persona/i)).toBeInTheDocument();
  });

  it("renders Wire Initiation Form and Dual-Control Approval Queue", async () => {
    render(<App />);

    expect(screen.getByText("Initiate Wire Transfer")).toBeInTheDocument();
    expect(screen.getByText("Dual-Control Approval Queue")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });
  });

  it("submits a new wire transfer", async () => {
    api.createWire.mockResolvedValueOnce({
      id: "wire-456",
      beneficiaryName: "Global Logistics",
      accountNumber: "9876543210",
      routingNumber: "021000021",
      amount: 25000,
      status: "PENDING",
      createdBy: "User A",
    });

    render(<App />);

    fireEvent.change(screen.getByPlaceholderText("e.g. Acme Industrial Corp"), {
      target: { value: "Global Logistics" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. 9876543210"), {
      target: { value: "9876543210" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. 021000021"), {
      target: { value: "021000021" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. 15000.00"), {
      target: { value: "25000" },
    });

    const submitBtn = screen.getByRole("button", {
      name: /Submit Wire Transfer/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.createWire).toHaveBeenCalledWith(
        {
          beneficiaryName: "Global Logistics",
          accountNumber: "9876543210",
          routingNumber: "021000021",
          amount: 25000,
        },
        "User A",
      );
    });
  });

  it("handles 403 Forbidden error toast on self-approval attempt", async () => {
    api.approveWire.mockRejectedValueOnce({
      response: {
        status: 403,
        data: { detail: "User cannot approve their own wire transfer." },
      },
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    const approveBtn = screen.getByRole("button", { name: /Approve/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/403 Forbidden/i)).toBeInTheDocument();
    });
  });
});
