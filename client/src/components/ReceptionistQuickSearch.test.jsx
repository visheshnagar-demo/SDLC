import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ReceptionistQuickSearch from "./ReceptionistQuickSearch";

describe("ReceptionistQuickSearch Component", () => {
  it("renders search input and action button", () => {
    render(<ReceptionistQuickSearch />);
    expect(
      screen.getByPlaceholderText(/Search by Pass Code/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Search Roster/i }),
    ).toBeInTheDocument();
  });
});
