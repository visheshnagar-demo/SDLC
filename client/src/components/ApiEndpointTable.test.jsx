import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import ApiEndpointTable from "./ApiEndpointTable";

const mockApis = [
  {
    id: "api-1",
    name: "Auth Service",
    target_url: "https://auth.internal/health",
    http_method: "GET",
    interval_seconds: 60,
    expected_status: 200,
    current_status: "Healthy",
    last_latency_ms: 45.2,
    is_active: true,
    last_checked_at: new Date().toISOString(),
    stats_24h: { uptime_pct: 100 },
  },
  {
    id: "api-2",
    name: "Payment Service",
    target_url: "https://pay.internal/status",
    http_method: "POST",
    interval_seconds: 30,
    expected_status: 200,
    current_status: "Down",
    last_latency_ms: 1200.0,
    is_active: true,
    last_checked_at: new Date().toISOString(),
    stats_24h: { uptime_pct: 85 },
  },
];

describe("ApiEndpointTable Component", () => {
  it("renders table headers and API rows", () => {
    render(
      <BrowserRouter>
        <ApiEndpointTable apis={mockApis} />
      </BrowserRouter>,
    );

    expect(screen.getByText("Auth Service")).toBeInTheDocument();
    expect(screen.getByText("Payment Service")).toBeInTheDocument();
    expect(screen.getByText("Healthy")).toBeInTheDocument();
    expect(screen.getByText("Down")).toBeInTheDocument();
  });

  it("filters APIs based on search input", () => {
    render(
      <BrowserRouter>
        <ApiEndpointTable apis={mockApis} />
      </BrowserRouter>,
    );

    const searchInput = screen.getByPlaceholderText(/search by name/i);
    fireEvent.change(searchInput, { target: { value: "Payment" } });

    expect(screen.queryByText("Auth Service")).not.toBeInTheDocument();
    expect(screen.getByText("Payment Service")).toBeInTheDocument();
  });

  it("triggers onTriggerCheck when action button is clicked", () => {
    const handleCheck = vi.fn();
    render(
      <BrowserRouter>
        <ApiEndpointTable apis={mockApis} onTriggerCheck={handleCheck} />
      </BrowserRouter>,
    );

    const checkButtons = screen.getAllByTitle(/trigger health probe now/i);
    fireEvent.click(checkButtons[0]);
    expect(handleCheck).toHaveBeenCalledWith("api-1");
  });
});
