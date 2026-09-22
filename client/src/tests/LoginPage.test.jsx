import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";
import { LoginPage } from "../pages/LoginPage";

describe("LoginPage Component", () => {
  it("renders login form with pre-filled test credentials and help note", () => {
    render(
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <BrowserRouter>
              <LoginPage />
            </BrowserRouter>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>,
    );

    expect(screen.getByText(/Collector Vault Sign In/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Account Credentials/i)).toBeInTheDocument();
    expect(screen.getAllByText(/test@example.com/i).length).toBeGreaterThan(0);
  });
});
