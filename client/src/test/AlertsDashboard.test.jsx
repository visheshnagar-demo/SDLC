import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AlertsDashboardPage from "../pages/AlertsDashboardPage";
import * as api from "../services/api";

vi.mock("../services/api");

describe("AlertsDashboardPage", () => {
  const mockAlerts = [
    {
      id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      account_id: "ACC-982341",
      severity: "CRITICAL",
      risk_score: 85,
      status: "NEW",
      created_at: "2026-05-18T14:30:00Z",
      transaction: {
        id: "tx-101",
        account_id: "ACC-982341",
        amount: 12500,
        currency: "USD",
        merchant: "London Wire Transfer",
        location_name: "New York, NY",
        latitude: 40.7128,
        longitude: -74.006,
        timestamp: "2026-05-18T14:30:00Z",
      },
      violations: [
        {
          id: "v-1",
          rule_type: "AMOUNT_THRESHOLD",
          rule_name: "High Transaction Amount Threshold",
          violation_details: {
            threshold_amount: 10000,
            actual_amount: 12500,
            breach_amount: 2500,
          },
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    api.getAlerts.mockResolvedValue(mockAlerts);
  });

  it("renders the dashboard title and KPI metric cards", async () => {
    render(
      <MemoryRouter>
        <AlertsDashboardPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Transaction Monitoring & Alert Dashboard/i),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Total Open Alerts")).toBeInTheDocument();
      expect(screen.getByText("Critical Severity")).toBeInTheDocument();
      expect(screen.getByText("Under Review")).toBeInTheDocument();
      expect(screen.getByText("Confirmed Fraud")).toBeInTheDocument();
    });
  });

  it("renders the alerts table with alert data", async () => {
    render(
      <MemoryRouter>
        <AlertsDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/ALT-A1B2C3D4/i)).toBeInTheDocument();
      expect(screen.getAllByText(/ACC-982341/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/CRITICAL/i).length).toBeGreaterThan(0);
    });
  });
});
