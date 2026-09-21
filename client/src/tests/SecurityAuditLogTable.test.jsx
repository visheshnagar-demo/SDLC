import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SecurityAuditLogTable from "../components/audit/SecurityAuditLogTable";

vi.mock("../services/api", () => ({
  getAuditLogs: vi
    .fn()
    .mockResolvedValue([
      {
        id: "log-100",
        user_role: "ADMIN",
        action: "CREATE_INMATE",
        created_at: new Date().toISOString(),
      },
    ]),
}));

describe("SecurityAuditLogTable Component", () => {
  it("renders audit trail header and table", async () => {
    render(<SecurityAuditLogTable />);
    expect(
      await screen.findByText(/IMMUTABLE SECURITY AUDIT LOG TRAIL/i),
    ).toBeInView();
    expect(await screen.findByText("CREATE_INMATE")).toBeInView();
  });
});
