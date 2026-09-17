import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import TransfersPage from "../pages/TransfersPage";

describe("TransfersPage", () => {
  it("renders ACID transfers header and interactive terminal", () => {
    render(
      <BrowserRouter>
        <TransfersPage />
      </BrowserRouter>,
    );

    expect(
      screen.getByText("ACID Ledger Transfers & Allocations"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Interactive Transfer Terminal"),
    ).toBeInTheDocument();
  });
});
