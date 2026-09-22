import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ConditionScorecard } from "../components/detail/ConditionScorecard";

describe("ConditionScorecard Component", () => {
  it("renders condition score breakdown and metrics", () => {
    const watch = {
      condition_score: 9.8,
      condition_grade: "MINT",
      certificate_number: "CERT-99281",
    };

    render(<ConditionScorecard watch={watch} />);

    expect(
      screen.getByText(/Atelier Condition Scorecard/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/9.8 \/ 10 MINT/i)).toBeInTheDocument();
    expect(screen.getByText(/Case & Lugs/i)).toBeInTheDocument();
    expect(screen.getByText(/#CERT-99281/i)).toBeInTheDocument();
  });
});
