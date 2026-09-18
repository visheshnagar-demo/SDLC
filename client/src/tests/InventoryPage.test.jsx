import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import InventoryPage from "../pages/InventoryPage";

describe("InventoryPage", () => {
  it("renders temple inventory and precious vault card", () => {
    render(<InventoryPage />);
    expect(
      screen.getByText(/Temple Inventory & Seva Asset Tracker/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Precious Vault & Sacred Ornaments/i),
    ).toBeInTheDocument();
  });
});
