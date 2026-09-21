import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";
import HousingPage from "../pages/HousingPage.jsx";

describe("HousingPage Component", () => {
  it("renders housing cell grid matrix and keep-away registration form", () => {
    render(
      <BrowserRouter>
        <HousingPage />
      </BrowserRouter>,
    );

    expect(
      screen.getByText(/Housing Assignment & Cell Block Matrix/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Register Keep-Away Conflict Rule/i),
    ).toBeInTheDocument();
  });
});
