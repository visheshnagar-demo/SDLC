import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";
import ReleasesPage from "../pages/ReleasesPage.jsx";

describe("ReleasesPage Component", () => {
  it("renders statutory release checklist and audit log panel", () => {
    render(
      <BrowserRouter>
        <ReleasesPage />
      </BrowserRouter>,
    );

    expect(
      screen.getByText(/Statutory Release Checklist & Detainer Gate/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Immutable Audit Log/i)).toBeInTheDocument();
  });
});
