import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App.jsx";
import * as api from "./services/api.js";

vi.mock("./services/api.js");

describe("Commercial Wire Dashboard App", () => {
  const mockPendingWires = [
    {
      id: "wire-101",
      beneficiaryName: "Acme Industrial Corp",
      accountNumber: "1234567890",
      routingNumber: "121000358",
      amount: 15000.0,
      status: "PENDING",
      createdBy: "User A (Maker)",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    api.getPendingWires.mockResolvedValue(mockPendingWires);
  });

  it("renders the header, metrics bar, form, and pending table", async () => {
    render(<App />);

    expect(screen.getByText("Global Commercial Bank")).toBeInTheDocument();
    expect(
      screen.getByText("Commercial Wire Management Portal"),
    ).toBeInTheDocument();
    expect(screen.getByText("Initiate Wire Transfer")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Pending Approval Queue")).toBeInTheDocument();
      expect(screen.getByText("Acme Industrial Corp")).toBeInTheDocument();
    });
  });

  it("allows switching current user persona via dropdown", async () => {
    render(<App />);

    const userSelect = screen.getByLabelText("User Switcher");
    expect(userSelect).toHaveValue("User A (Maker)");

    fireEvent.change(userSelect, { target: { value: "User B (Checker)" } });
    expect(userSelect).toHaveValue("User B (Checker)");
  });

  it("submits a new wire transfer and triggers api call", async () => {
    api.createWire.mockResolvedValueOnce({
      id: "wire-102",
      beneficiaryName: "Acme Industrial Corp",
      accountNumber: "1234567890",
      routingNumber: "121000358",
      amount: 15000.0,
      status: "PENDING",
      createdBy: "User A (Maker)",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    render(<App />);

    const submitBtn = screen.getByRole("button", {
      name: /Submit Wire Transfer/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.createWire).toHaveBeenCalledWith({
        beneficiaryName: "Acme Industrial Corp",
        accountNumber: "1234567890",
        routingNumber: "121000358",
        amount: 15000.0,
        createdBy: "User A (Maker)",
      });
    });
  });

  it("displays 403 error toast when self-approval fails", async () => {
    api.approveWire.mockRejectedValueOnce({
      response: {
        status: 403,
        data: {
          detail:
            "Segregation of duties violation: Maker cannot approve their own wire.",
        },
      },
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Acme Industrial Corp")).toBeInTheDocument();
    });

    const approveBtns = screen.getAllByRole("button", { name: /Approve/i });
    fireEvent.click(approveBtns[0]);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(
        screen.getByText("🚫 403 Forbidden: Action Denied"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Segregation of duties violation: Maker cannot approve their own wire.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("approves a wire transfer when performed by a Checker", async () => {
    api.approveWire.mockResolvedValueOnce({
      id: "wire-101",
      status: "APPROVED",
      approvedBy: "User B (Checker)",
    });

    render(<App />);

    // Switch user to User B (Checker)
    const userSelect = screen.getByLabelText("User Switcher");
    fireEvent.change(userSelect, { target: { value: "User B (Checker)" } });

    await waitFor(() => {
      expect(screen.getByText("Acme Industrial Corp")).toBeInTheDocument();
    });

    const approveBtns = screen.getAllByRole("button", { name: /Approve/i });
    fireEvent.click(approveBtns[0]);

    await waitFor(() => {
      expect(api.approveWire).toHaveBeenCalledWith(
        "wire-101",
        "User B (Checker)",
      );
      expect(screen.getByText("Wire Approved")).toBeInTheDocument();
    });
  });
});
