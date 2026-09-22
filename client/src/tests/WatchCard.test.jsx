import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";
import { WatchCard } from "../components/catalog/WatchCard";

const testWatch = {
  id: "test-w-1",
  brand: "Rolex",
  model: "Submariner Date 41mm",
  reference_number: "126610LN",
  price: 14850,
  condition_score: 9.8,
  condition_grade: "MINT",
  box_included: true,
  papers_included: true,
  status: "AVAILABLE",
  image_urls: ["https://example.com/watch.jpg"],
};

describe("WatchCard Component", () => {
  it("renders brand, model, and price", () => {
    render(
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <BrowserRouter>
              <WatchCard watch={testWatch} />
            </BrowserRouter>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>,
    );

    expect(screen.getByText("Rolex")).toBeInTheDocument();
    expect(screen.getByText("Submariner Date 41mm")).toBeInTheDocument();
    expect(screen.getByText(/14,850/)).toBeInTheDocument();
    expect(screen.getByText(/Inspect Details/i)).toBeInTheDocument();
  });
});
