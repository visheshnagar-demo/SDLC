import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Badge from "../components/common/Badge.jsx";

describe("Badge Component", () => {
  it("renders badge text properly", () => {
    render(<Badge variant="success">Active Status</Badge>);
    expect(screen.getByText("Active Status")).toBeInTheDocument();
  });

  it("renders with different variant styles", () => {
    const { container } = render(
      <Badge variant="warning">Pending Review</Badge>,
    );
    expect(screen.getByText("Pending Review")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("bg-amber-50");
  });
});
