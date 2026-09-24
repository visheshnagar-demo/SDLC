import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MonitorsTable from "../components/MonitorsTable";

const mockMonitors = [
  {
    id: "mon-123",
    name: "Auth Gateway",
    url: "https://auth.example.com/health",
    http_method: "GET",
    check_interval_seconds: 30,
    expected_status_code: 200,
    timeout_ms: 3000,
    is_active: true,
    current_status: "HEALTHY",
    last_latency_ms: 85.4,
    last_checked_at: "2026-09-24T12:00:00Z",
  },
];

describe("MonitorsTable Component", () => {
  it("renders empty state when no monitors are provided", () => {
    render(<MonitorsTable monitors={[]} />);
    expect(
      screen.getByText("No Monitored APIs Registered"),
    ).toBeInTheDocument();
  });

  it("renders table rows for monitors", () => {
    render(<MonitorsTable monitors={mockMonitors} />);
    expect(screen.getByText("Auth Gateway")).toBeInTheDocument();
    expect(
      screen.getByText("https://auth.example.com/health"),
    ).toBeInTheDocument();
    expect(screen.getByText("85.4 ms")).toBeInTheDocument();
  });

  it("triggers onRunCheck callback when check button is clicked", () => {
    const handleRunCheck = vi.fn();
    render(
      <MonitorsTable monitors={mockMonitors} onRunCheck={handleRunCheck} />,
    );

    const runBtn = screen.getByRole("button", {
      name: /Run check for Auth Gateway/i,
    });
    fireEvent.click(runBtn);
    expect(handleRunCheck).toHaveBeenCalledWith("mon-123");
  });
});
