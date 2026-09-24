import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import StatusBadge from "../components/StatusBadge";

describe("StatusBadge Component", () => {
  it("renders HEALTHY status correctly", () => {
    render(<StatusBadge status="HEALTHY" />);
    expect(screen.getByText("HEALTHY")).toBeInTheDocument();
  });

  it("renders DEGRADED status correctly", () => {
    render(<StatusBadge status="DEGRADED" />);
    expect(screen.getByText("DEGRADED")).toBeInTheDocument();
  });

  it("renders UNHEALTHY status correctly", () => {
    render(<StatusBadge status="UNHEALTHY" />);
    expect(screen.getByText("UNHEALTHY")).toBeInTheDocument();
  });

  it("renders INACTIVE status correctly", () => {
    render(<StatusBadge status="INACTIVE" />);
    expect(screen.getByText("INACTIVE")).toBeInTheDocument();
  });
});
