import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FailureLogStream from "../components/FailureLogStream";

const mockLogs = [
  {
    id: "log-1",
    monitor_id: "mon-1",
    monitor_name: "Payment Service",
    endpoint_url: "https://pay.example.com/health",
    status: "UNHEALTHY",
    status_code: 500,
    latency_ms: 5002,
    error_message: "Gateway Timeout (5000ms exceeded)",
    executed_at: "2026-09-24T10:15:00Z",
  },
];

describe("FailureLogStream Component", () => {
  it("renders operational state when logs are empty", () => {
    render(<FailureLogStream logs={[]} />);
    expect(screen.getByText("All Services Operational")).toBeInTheDocument();
  });

  it("renders failure logs rows correctly", () => {
    render(<FailureLogStream logs={mockLogs} />);
    expect(screen.getByText("Payment Service")).toBeInTheDocument();
    expect(screen.getByText(/Gateway Timeout/i)).toBeInTheDocument();
  });

  it("triggers onSelectLog when eye button is clicked", () => {
    const handleSelect = vi.fn();
    render(<FailureLogStream logs={mockLogs} onSelectLog={handleSelect} />);

    const viewBtn = screen.getByRole("button", {
      name: /View diagnostic details/i,
    });
    fireEvent.click(viewBtn);
    expect(handleSelect).toHaveBeenCalledWith(mockLogs[0]);
  });
});
