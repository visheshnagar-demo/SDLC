import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import ApiEndpointTable from "./ApiEndpointTable";

describe("ApiEndpointTable", () => {
  const mockApis = [
    {
      id: "api-1",
      name: "Auth Service Health",
      target_url: "https://api.internal/v1/auth/health",
      http_method: "GET",
      interval_seconds: 60,
      current_status: "Healthy",
      last_latency_ms: 45.2,
      last_checked_at: "2026-09-21T10:00:00Z",
      is_active: true,
    },
    {
      id: "api-2",
      name: "Payment Webhook Probe",
      target_url: "https://api.internal/v1/payments/health",
      http_method: "POST",
      interval_seconds: 30,
      current_status: "Down",
      last_latency_ms: 512.0,
      last_checked_at: "2026-09-21T10:05:00Z",
      is_active: true,
    },
  ];

  it("renders table headers and rows for APIs", () => {
    render(
      <BrowserRouter>
        <ApiEndpointTable apis={mockApis} isLoading={false} />
      </BrowserRouter>,
    );

    expect(screen.getByText("Auth Service Health")).toBeInTheDocument();
    expect(screen.getByText("Payment Webhook Probe")).toBeInTheDocument();
    expect(
      screen.getByText("https://api.internal/v1/auth/health"),
    ).toBeInTheDocument();
    expect(screen.getByText("Healthy")).toBeInTheDocument();
    expect(screen.getByText("Down")).toBeInTheDocument();
  });

  it("renders loading state indicator", () => {
    render(
      <BrowserRouter>
        <ApiEndpointTable apis={[]} isLoading={true} />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Loading registered APIs/i)).toBeInTheDocument();
  });

  it("renders empty state when no APIs provided", () => {
    render(
      <BrowserRouter>
        <ApiEndpointTable apis={[]} isLoading={false} />
      </BrowserRouter>,
    );

    expect(screen.getByText(/No Monitored APIs Found/i)).toBeInTheDocument();
  });
});
