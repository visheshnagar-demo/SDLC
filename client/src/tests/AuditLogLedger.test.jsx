import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import AuditLogLedger from "../components/releases/AuditLogLedger";

describe("AuditLogLedger Component", () => {
  const mockLogs = [
    {
      id: "log-1",
      action: "RELEASE_CREATED",
      entity_type: "Release",
      entity_id: "rel-12345678",
      changed_by: "release-lead@company.com",
      created_at: "2026-06-10T12:00:00Z",
      details: { semver: "v1.2.0", name: "Core Release" },
    },
  ];

  it("renders audit actions and actor information", () => {
    render(<AuditLogLedger logs={mockLogs} />);

    expect(screen.getByText("RELEASE_CREATED")).toBeInTheDocument();
    expect(screen.getByText(/rel-1234/i)).toBeInTheDocument();
    expect(screen.getByText("release-lead@company.com")).toBeInTheDocument();
  });

  it("shows empty state when no audit records exist", () => {
    render(<AuditLogLedger logs={[]} />);
    expect(screen.getByText("No audit events recorded")).toBeInTheDocument();
  });
});
