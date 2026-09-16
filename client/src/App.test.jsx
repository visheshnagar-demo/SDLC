import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./App";

// Mock the API calls so unit tests don't require a running backend
vi.mock("./services/api", () => ({
  tenantApi: {
    getTenants: vi.fn().mockResolvedValue([
      {
        id: "tenant-acme-101",
        tenant_id: "tenant-acme-101",
        name: "Acme Corp",
        slug: "acme-corp",
        status: "ACTIVE",
        tier_name: "Enterprise",
        primary_domain: "acme.yourplatform.com",
        active_users_count: 5,
        storage_used_gb: 2,
        created_at: "2026-01-01T00:00:00Z",
      },
    ]),
    getSubscriptionTiers: vi.fn().mockResolvedValue([
      { id: "1", display_name: "Starter", max_users: 10, max_storage_gb: 5 },
      { id: "2", display_name: "Pro", max_users: 100, max_storage_gb: 50 },
      {
        id: "3",
        display_name: "Enterprise",
        max_users: 1000,
        max_storage_gb: 500,
      },
    ]),
    getTenantDetails: vi.fn().mockResolvedValue({
      id: "tenant-acme-101",
      tenant_id: "tenant-acme-101",
      name: "Acme Corp",
      slug: "acme-corp",
      status: "ACTIVE",
      tier_name: "Enterprise",
      admin_email: "admin@acme.com",
      custom_max_users: 1000,
      custom_max_storage_gb: 500,
    }),
    getDomains: vi.fn().mockResolvedValue([]),
    getTenantUsage: vi.fn().mockResolvedValue({
      active_users: 5,
      storage_used_gb: 2,
      max_users: 1000,
      max_storage_gb: 500,
      usage_percentage_users: 1,
      usage_percentage_storage: 1,
    }),
    getAuditLogs: vi
      .fn()
      .mockResolvedValue({ items: [], total: 0, skip: 0, limit: 50 }),
  },
}));

describe("TenantControl Application", () => {
  it("renders the TenantControl brand and main directory heading", async () => {
    render(<App />);

    // Verify brand logo text
    expect(screen.getByText("TenantControl")).toBeInTheDocument();

    // Verify main overview header
    const mainHeading = await screen.findByText("Tenant Overview & Directory");
    expect(mainHeading).toBeInTheDocument();
  });

  it("renders KPI metric card headings", async () => {
    render(<App />);

    expect(screen.getByText("Total Registered Tenants")).toBeInTheDocument();
    expect(screen.getByText("Active Tenant Rate")).toBeInTheDocument();
  });
});
