import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import BlockerAlert from "../components/releases/BlockerAlert";

describe("BlockerAlert Component", () => {
  it("renders nothing when there are 0 unresolved blockers", () => {
    const { container } = render(
      <BlockerAlert unresolvedBlockers={0} blockerItems={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders warning banner when blocker bugs are present", () => {
    const blockers = [
      { id: "1", issue_key: "BUG-101", summary: "Payment webhook dropped" },
    ];

    render(<BlockerAlert unresolvedBlockers={1} blockerItems={blockers} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/1 Active Blocker Bug/i)).toBeInTheDocument();
    expect(
      screen.getByText(/BUG-101: Payment webhook dropped/i),
    ).toBeInTheDocument();
  });
});
