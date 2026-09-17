import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import InventoryPage from "../pages/InventoryPage";

describe("InventoryPage", () => {
  it("renders chip catalog title and inventory tables", async () => {
    render(
      <BrowserRouter>
        <InventoryPage />
      </BrowserRouter>,
    );

    expect(
      screen.getByText("Chip Catalog & Vault Batches"),
    ).toBeInTheDocument();
    expect(screen.getByText("New Chip Definition")).toBeInTheDocument();
  });
});
