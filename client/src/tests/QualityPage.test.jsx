import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import QualityPage from "../pages/QualityPage";

describe("QualityPage", () => {
  it("renders Water Quality header", async () => {
    render(
      <BrowserRouter>
        <QualityPage />
      </BrowserRouter>,
    );
    expect(
      await screen.findByText(/Water Quality & Filtration Assurance/i),
    ).toBeInTheDocument();
  });
});
