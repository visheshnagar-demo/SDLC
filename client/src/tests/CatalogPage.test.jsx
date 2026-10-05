import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CatalogPage from "../pages/CatalogPage";
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
  {
    id: "b2",
    isbn: "9780451524935",
    title: "1984",
    author: "George Orwell",
    genre: "Fiction",
    publication_year: 1949,
    total_copies: 4,
    available_copies: 0,
  },
  {
    id: "b3",
    isbn: "9780143127741",
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    genre: "History",
    publication_year: 2014,
    total_copies: 3,
    available_copies: 2,
  },
];

describe("CatalogPage Component", () => {
  beforeEach(() => {
    vi.spyOn(api, "getBooks").mockResolvedValue(mockBooks);
    vi.spyOn(api, "getPatrons").mockResolvedValue([]);
  });

  it("renders catalog page header and books correctly", async () => {
    render(
      <BrowserRouter>
        <CatalogPage />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Library Book Catalog/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("The Great Gatsby")).toBeInTheDocument();
      expect(screen.getByText("1984")).toBeInTheDocument();
      expect(
        screen.getByText("Sapiens: A Brief History of Humankind"),
      ).toBeInTheDocument();
    });
  });

  it("filters books by search query", async () => {
    render(
      <BrowserRouter>
        <CatalogPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("The Great Gatsby")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    fireEvent.change(searchInput, { target: { value: "Gatsby" } });

    expect(screen.getByText("The Great Gatsby")).toBeInTheDocument();
    expect(screen.queryByText("1984")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Sapiens: A Brief History of Humankind"),
    ).not.toBeInTheDocument();
  });

  it("filters books by in-stock availability", async () => {
    render(
      <BrowserRouter>
        <CatalogPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("1984")).toBeInTheDocument();
    });

    const inStockToggle = screen.getByLabelText(/In-Stock Only/i);
    fireEvent.click(inStockToggle);

    expect(screen.getByText("The Great Gatsby")).toBeInTheDocument();
    expect(screen.queryByText("1984")).not.toBeInTheDocument();
  });
});
