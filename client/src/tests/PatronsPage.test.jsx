import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PatronsPage from "../pages/PatronsPage";
import * as api from "../services/api";

const mockPatrons = [
  {
    id: "p1-uuid",
    full_name: "Jane Doe",
    email: "jane.doe@example.com",
    phone_number: "+1 555-0100",
    max_borrow_limit: 5,
    active_loans_count: 2,
    total_fines_due: 0.0,
    account_status: "active",
  },
];

describe("PatronsPage Component", () => {
  beforeEach(() => {
    vi.spyOn(api, "getPatrons").mockResolvedValue(mockPatrons);
    vi.spyOn(api, "createPatron").mockResolvedValue({
      id: "p2-uuid",
      full_name: "John Smith",
    });
    vi.spyOn(api, "getPatronLoans").mockResolvedValue([]);
  });

  it("renders patron accounts ledger with borrowing quota", async () => {
    render(<PatronsPage />);

    expect(
      screen.getByText(/Patron Management Directory/i),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
      expect(screen.getByText("jane.doe@example.com")).toBeInTheDocument();
      expect(screen.getByText(/2 \/ 5 books/i)).toBeInTheDocument();
    });
  });

  it("toggles register patron form", async () => {
    render(<PatronsPage />);

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    const registerBtn = screen.getByRole("button", {
      name: /Register New Patron/i,
    });
    fireEvent.click(registerBtn);

    expect(
      screen.getAllByText(/Register New Patron/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
  });
});
