import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ShippingTierSelector } from "../components/checkout/ShippingTierSelector";

describe("ShippingTierSelector Component", () => {
  it("renders both insured shipping tiers and handles selection", () => {
    const onSelect = vi.fn();
    render(
      <ShippingTierSelector
        selectedTier="ferrari_express"
        onSelectTier={onSelect}
      />,
    );

    expect(
      screen.getByText(/Ferrari Group Armored Express/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Malca-Amit Priority Secure/i)).toBeInTheDocument();
    expect(screen.getByText("$150.00")).toBeInTheDocument();
  });
});
