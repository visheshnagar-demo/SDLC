import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App Component", () => {
  it("renders navbar, titles, and switches between studio and dashboard", () => {
    render(<App />);

    expect(screen.getByText("Email Classifier AI")).toBeInTheDocument();
    expect(screen.getByText("Classify Studio")).toBeInTheDocument();
    expect(screen.getByText("Review Dashboard")).toBeInTheDocument();

    // Default tab is Studio
    expect(
      screen.getByText("Email Ingestion & Classification Studio"),
    ).toBeInTheDocument();

    // Switch to Dashboard
    const dashboardTab = screen.getByRole("button", {
      name: /Review Dashboard/i,
    });
    fireEvent.click(dashboardTab);

    expect(
      screen.getByText("Email Review & Classification Dashboard"),
    ).toBeInTheDocument();
  });
});
