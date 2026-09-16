import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ACHTransferForm from "./ACHTransferForm";
import * as achService from "../services/achService";

vi.mock("../services/achService");

describe("ACHTransferForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form inputs and submit button", () => {
    render(<ACHTransferForm />);
    expect(
      screen.getByText(/Initiate Outbound ACH Transfer/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Account ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Transfer Amount/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Submit Transfer/i }),
    ).toBeInTheDocument();
  });

  it("shows error on invalid empty amount or empty account ID", async () => {
    render(<ACHTransferForm />);
    const accountInput = screen.getByLabelText(/Account ID/i);
    fireEvent.change(accountInput, { target: { value: "" } });

    const submitBtn = screen.getByRole("button", { name: /Submit Transfer/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/Account ID is required/i),
    ).toBeInTheDocument();
  });

  it("calls submitACHTransfer and shows success alert on normal approval", async () => {
    achService.submitACHTransfer.mockResolvedValueOnce({
      success: true,
      correlationId: "cid-normal-100",
      amlReview: false,
      data: { transfer_id: "t-1" },
    });

    render(<ACHTransferForm />);
    const accountInput = screen.getByLabelText(/Account ID/i);
    const amountInput = screen.getByLabelText(/Transfer Amount/i);

    fireEvent.change(accountInput, {
      target: { value: "123e4567-e89b-12d3-a456-426614174000" },
    });
    fireEvent.change(amountInput, { target: { value: "1500" } });

    const submitBtn = screen.getByRole("button", { name: /Submit Transfer/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText(/Transfer Approved/i)).toBeInTheDocument();
  });
});
