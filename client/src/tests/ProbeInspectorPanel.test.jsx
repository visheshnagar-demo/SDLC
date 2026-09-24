import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ProbeInspectorPanel from "../components/ProbeInspectorPanel";

const mockLog = {
  id: "log-99",
  monitor_name: "Auth API",
  endpoint_url: "https://auth.example.com/api/v1/health",
  http_method: "POST",
  status: "UNHEALTHY",
  status_code: 503,
  latency_ms: 1250,
  error_message: "Service Unavailable - database connection pool exhausted",
  executed_at: "2026-09-24T10:00:00Z",
};

describe("ProbeInspectorPanel Component", () => {
  it("does not render when log is null", () => {
    const { container } = render(
      <ProbeInspectorPanel log={null} onClose={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders probe diagnostics and timing breakdown", () => {
    render(<ProbeInspectorPanel log={mockLog} onClose={vi.fn()} />);
    expect(screen.getByText("Probe Diagnostic Inspector")).toBeInTheDocument();
    expect(screen.getAllByText("Auth API").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        /Service Unavailable - database connection pool exhausted/i,
      ).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("DNS Lookup")).toBeInTheDocument();
  });

  it("triggers onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(<ProbeInspectorPanel log={mockLog} onClose={handleClose} />);

    const closeBtn = screen.getByRole("button", { name: /Close inspector/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});
