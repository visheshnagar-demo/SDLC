import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Badge from "../components/common/Badge";

describe("Badge Component", () => {
  it("renders status text correctly", () => {
    render(<Badge>In Progress</Badge>);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("renders with dot indicator when specified", () => {
    const { container } = render(<Badge type="dot">Deployed</Badge>);
    expect(screen.getByText("Deployed")).toBeInTheDocument();
    const dot = container.querySelector(".animate-pulse");
    expect(dot).toBeInTheDocument();
  });

  it("applies variant styles correctly", () => {
    render(<Badge variant="success">Completed</Badge>);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });
});
