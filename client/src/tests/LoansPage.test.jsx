import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoansPage from "../pages/LoansPage";
import * as api from "../services/api";

const mockLoans = [
  {
    id: "l1",
    book_id: "b1",
    patron_id: "p1",
    book_title: "The Great Gatsby",
    patron_name: "Jane Doe",
    checkout_date: "2026-10-01T10:00:00Z",
    due_date: "2026-10-15T10:00:00Z",
    return_date: null,
    status: "active",
    fine_amount: 0.0,
  },
  {
    id: "l2",
    book_id: "b2",
    patron_id: "p2",
    book_title: "1984",
    patron_name: "John Smith",
    checkout_date: "2026-09-01T10:00:00Z",
    due_date: "2026-09-15T10:00:00Z",
    return_date: null,
    status: "overdue",
    fine_amount: 10.0,
  },
];

describe("LoansPage Component", () => {
  beforeEach(() => {
    vi.spyOn(api, "getLoans").mockResolvedValue(mockLoans);
    vi.spyOn(api, "getBooks").mockResolvedValue([]);
    vi.spyOn(api, "getPatrons").mockResolvedValue([]);
    vi.spyOn(api, "returnBook").mockResolvedValue({
      id: "l1",
      status: "returned",
      fine_amount: 0,
    });
  });

  it("renders circulation desk and loans list", async () => {
    render(<LoansPage />);

    expect(screen.getByText(/Circulation Desk & Loans/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("The Great Gatsby")).toBeInTheDocument();
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
      expect(screen.getByText("1984")).toBeInTheDocument();
      expect(screen.getByText("John Smith")).toBeInTheDocument();
    });
  });

  it("filters by overdue tab", async () => {
    render(<LoansPage />);

    await waitFor(() => {
      expect(screen.getByText("The Great Gatsby")).toBeInTheDocument();
    });

    const overdueTab = screen.getByRole("button", { name: /Overdue/i });
    fireEvent.click(overdueTab);

    expect(screen.getByText("1984")).toBeInTheDocument();
    expect(screen.queryByText("The Great Gatsby")).not.toBeInTheDocument();
  });
});
