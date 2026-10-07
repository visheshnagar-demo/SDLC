import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { CattleInventoryPage } from "../pages/CattleInventoryPage";

describe("CattleInventoryPage", () => {
  it("renders cattle management page header and table container", () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <CattleInventoryPage />
        </BrowserRouter>
      </AuthProvider>,
    );

    expect(
      screen.getByText(/Cattle Inventory Management/i),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Search Tag ID, Breed, Location.../i),
    ).toBeInTheDocument();
  });
});
