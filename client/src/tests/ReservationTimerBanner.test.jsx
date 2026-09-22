import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CartProvider } from "../context/CartContext";
import { ReservationTimerBanner } from "../components/checkout/ReservationTimerBanner";

describe("ReservationTimerBanner Component", () => {
  it("renders concurrency information banner", () => {
    render(
      <CartProvider>
        <ReservationTimerBanner />
      </CartProvider>,
    );

    expect(
      screen.getByText(/15-minute lock secures the item during checkout/i),
    ).toBeInTheDocument();
  });
});
