import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import CategoryBadge from "../components/CategoryBadge";

describe("CategoryBadge Component", () => {
  it("renders standard category correctly", () => {
    render(<CategoryBadge category="Work" confidenceScore={0.88} />);
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("(88%)")).toBeInTheDocument();
  });

  it("renders Urgent category with appropriate styling", () => {
    render(<CategoryBadge category="Urgent" confidenceScore={0.95} />);
    expect(screen.getByText("Urgent")).toBeInTheDocument();
    expect(screen.getByText("(95%)")).toBeInTheDocument();
  });

  it("renders Overridden badge when isOverridden is true", () => {
    render(
      <CategoryBadge
        category="Personal"
        confidenceScore={0.72}
        isOverridden={true}
      />,
    );
    expect(screen.getByText("Personal")).toBeInTheDocument();
    expect(screen.getByText("Overridden")).toBeInTheDocument();
    expect(screen.queryByText("(72%)")).not.toBeInTheDocument();
  });

  it("falls back to Uncategorized for unknown categories", () => {
    render(<CategoryBadge category="UnknownXYZ" />);
    expect(screen.getByText("Uncategorized")).toBeInTheDocument();
  });
});
