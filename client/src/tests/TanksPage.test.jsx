import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import TanksPage from "../pages/TanksPage";

describe("TanksPage", () => {
  it("renders TanksPage header", async () => {
    render(
      <BrowserRouter>
        <TanksPage />
      </BrowserRouter>,
    );
    expect(
      await screen.findByText(/Storage Tank Inventory & Telemetry Control/i),
    ).toBeInTheDocument();
  });
});
