import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminBooksPage from "../pages/AdminBooksPage";
import * as api from "../services/api";

const mockBooks = [
  {
    id: "b1",
    isbn: "9780743273565",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genre: "Fiction",
    publication_year: 1925,
    total_copies: 5,
    available_copies: 5,
  },
];

describe("AdminBooksPage Component", () => {
  beforeEach(() => {
    vi.spyOn(api, "getBooks").mockResolvedValue(mockBooks);
    vi.spyOn(api, "createBook").mockResolvedValue({
      id: "b2",
      ...mockBooks[0],
    });
    vi.spyOn(api, "deleteBook").mockResolvedValue({ success: true });
  });

  it("renders inventory ledger and statistics", async () => {
    render(<AdminBooksPage />);

    expect(
      screen.getByText(/Inventory & Catalog Administration/i),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("The Great Gatsby")).toBeInTheDocument();
      expect(screen.getByText("9780743273565")).toBeInTheDocument();
    });
  });

  it("opens and closes the Add New Book form", async () => {
    render(<AdminBooksPage />);

    await waitFor(() => {
      expect(screen.getByText("The Great Gatsby")).toBeInTheDocument();
    });

    const addButton = screen.getByRole("button", { name: /Add New Book/i });
    fireEvent.click(addButton);

    expect(screen.getByText(/Add New Book Volume/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Book Title/i)).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(screen.queryByText(/Add New Book Volume/i)).not.toBeInTheDocument();
  });
});
