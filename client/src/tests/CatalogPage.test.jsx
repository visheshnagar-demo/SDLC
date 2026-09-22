import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";
import { CatalogPage } from "../pages/CatalogPage";

describe("CatalogPage Component", () => {
  it("renders catalog page with filter sidebar and header", () => {
    render(
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <BrowserRouter>
              <CatalogPage />
            </BrowserRouter>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>,
    );

    expect(
      screen.getByText(/Pre-Owned Branded Luxury Timepieces/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Faceted Filter/i)).toBeInTheDocument();
  });
});
