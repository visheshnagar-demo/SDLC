import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ClassificationDashboard } from "./ClassificationDashboard";

describe("ClassificationDashboard Component", () => {
  it("renders metric cards and category tabs", () => {
    render(
      <ClassificationDashboard onInspectEmail={vi.fn()} refreshSignal={0} />,
    );

    expect(screen.getByText("Total processed")).toBeInTheDocument();
    expect(screen.getByText("All Categories")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Work/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Urgent/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Personal/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Promotional/i }),
    ).toBeInTheDocument();
  });

  it("renders filter search input and threshold slider", () => {
    render(
      <ClassificationDashboard onInspectEmail={vi.fn()} refreshSignal={0} />,
    );

    expect(
      screen.getByPlaceholderText(/Search subject, sender, or text/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Min Confidence:/i)).toBeInTheDocument();
  });
});
