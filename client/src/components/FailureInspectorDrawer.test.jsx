import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FailureInspectorDrawer from "./FailureInspectorDrawer";

const mockFailure = {
  id: "fail-123",
  api_id: "api-1",
  api_name: "Auth Service",
  target_url: "https://auth.internal/health",
  response_status: 502,
  latency_ms: 1540.2,
  operational_status: "Down",
  is_success: false,
  error_message: "Bad Gateway: connection refused by upstream backend",
  request_headers: { "User-Agent": "HealthCheck/1.0" },
  response_body: '{"error": "upstream timeout"}',
  checked_at: "2026-09-21T12:00:00Z",
};

describe("FailureInspectorDrawer Component", () => {
  it("does not render when isOpen is false", () => {
    render(
      <FailureInspectorDrawer
        isOpen={false}
        failureLog={mockFailure}
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByText(/failure inspector/i)).not.toBeInTheDocument();
  });

  it("renders failure diagnostic details when open", () => {
    render(
      <FailureInspectorDrawer
        isOpen={true}
        failureLog={mockFailure}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/failure inspector/i)).toBeInTheDocument();
    expect(screen.getByText(/HTTP 502/i)).toBeInTheDocument();
    expect(
      screen.getByText(/bad gateway: connection refused by upstream backend/i),
    ).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", () => {
    const handleClose = vi.fn();
    render(
      <FailureInspectorDrawer
        isOpen={true}
        failureLog={mockFailure}
        onClose={handleClose}
      />,
    );
    const closeBtn = screen.getByRole("button", { name: /close inspector/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});
