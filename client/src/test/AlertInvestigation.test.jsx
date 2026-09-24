import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AlertInvestigationPage from "../pages/AlertInvestigationPage";
import * as api from "../services/api";

vi.mock("../services/api");

describe("AlertInvestigationPage", () => {
  const mockAlert = {
    id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    account_id: "ACC-982341",
    severity: "CRITICAL",
    risk_score: 85,
    status: "NEW",
    notes: "Initial flagged alert",
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
      {
        id: "v-2",
        rule_type: "GEOGRAPHIC_VELOCITY",
        rule_name: "Geographic Velocity (Impossible Travel)",
        violation_details: {
          distance_miles: 3459,
          time_diff_seconds: 2100,
          speed_mph: 5930,
          speed_limit_mph: 500,
        },
      },
    ],
  };

  const mockAuditLogs = [
    {
      id: "log-1",
      action: "ALERT_GENERATED",
      actor: "System Engine",
      entity_type: "alert",
      entity_id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      created_at: "2026-05-18T14:30:00Z",
      changes: { status: "NEW" },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    api.getAlertById.mockResolvedValue(mockAlert);
    api.getAuditLogs.mockResolvedValue(mockAuditLogs);
  });

  it("renders transaction evidence and triggered rules", async () => {
    render(
      <MemoryRouter
        initialEntries={["/alerts/a1b2c3d4-e5f6-7890-1234-567890abcdef"]}
      >
        <Routes>
          <Route path="/alerts/:id" element={<AlertInvestigationPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Investigation Dossier/i)).toBeInTheDocument();
      expect(screen.getByText(/Transaction Snapshot/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Triggered Detection Rules/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/High Transaction Amount Threshold/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Geographic Velocity \(Impossible Travel\)/i),
      ).toBeInTheDocument();
    });
  });

  it("renders workflow actions and audit timeline", async () => {
    render(
      <MemoryRouter
        initialEntries={["/alerts/a1b2c3d4-e5f6-7890-1234-567890abcdef"]}
      >
        <Routes>
          <Route path="/alerts/:id" element={<AlertInvestigationPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Investigation Actions & Workflow/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/Mark Under Review/i)).toBeInTheDocument();
      expect(screen.getByText(/Confirm Fraud/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Audit Trail & Decision History/i),
      ).toBeInTheDocument();
    });
  });
});
