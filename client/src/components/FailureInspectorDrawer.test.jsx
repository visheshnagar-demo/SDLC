import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FailureInspectorDrawer from "./FailureInspectorDrawer";

describe("FailureInspectorDrawer", () => {
  const mockLog = {
    id: "log-1234",
    api_name: "Auth Service",
    target_url: "https://api.internal/v1/auth/health",
    response_status: 502,
    latency_ms: 1200.5,
    operational_status: "Down",
    error_message: "Bad Gateway upstream connection timeout",
    request_headers: { "User-Agent": "Monitor/1.0" },
    response_body: '{"error": "bad_gateway"}',
    checked_at: "2026-09-21T11:00:00Z",
  };

  it("renders drawer details when open with log entry", () => {
    render(
      <FailureInspectorDrawer
        isOpen={true}
        onClose={vi.fn()}
        logEntry={mockLog}
      />,
    );

    expect(
      screen.getByText("Failure Diagnostic Inspector"),
    ).toBeInTheDocument();
    expect(screen.getByText(/502/i)).toBeInTheDocument();
    expect(screen.getByText(/1200.5 ms/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Bad Gateway upstream connection timeout/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Close Inspector")).toBeInTheDocument();
  });

  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <FailureInspectorDrawer
        isOpen={false}
        onClose={vi.fn()}
        logEntry={mockLog}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
