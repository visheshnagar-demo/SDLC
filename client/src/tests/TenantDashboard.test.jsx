import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import React from "react";
import TenantMetricsBar from "../components/tenants/TenantMetricsBar.jsx";
import TenantDirectoryTable from "../components/tenants/TenantDirectoryTable.jsx";
import QuotaConfigCard from "../components/tenants/QuotaConfigCard.jsx";
import UserRbacTable from "../components/tenants/UserRbacTable.jsx";
import AuditLogViewer from "../components/tenants/AuditLogViewer.jsx";

describe("Tenant Management UI Component Tests", () => {
  const mockTenants = [
    {
      id: "tenant-1",
      name: "Acme Corp",
      slug: "acme-corp",
      domain: "acme.com",
      status: "Active",
      created_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "tenant-2",
      name: "Beta LLC",
      slug: "beta-llc",
      domain: "beta.com",
      status: "Suspended",
      created_at: "2026-01-02T00:00:00Z",
    },
  ];

  it("renders TenantMetricsBar with correct KPI values", () => {
    render(<TenantMetricsBar tenants={mockTenants} total={2} />);
    expect(screen.getByText("Total Tenants")).toBeInTheDocument();
    expect(screen.getByText("Active Tenants")).toBeInTheDocument();
    expect(screen.getByText("Suspended")).toBeInTheDocument();
  });

  it("renders TenantDirectoryTable with tenant rows", () => {
    const handleSelect = vi.fn();
    const handleStatusChange = vi.fn();

    render(
      <TenantDirectoryTable
        tenants={mockTenants}
        loading={false}
        onSelectTenant={handleSelect}
        onStatusChange={handleStatusChange}
        searchQuery=""
        setSearchQuery={() => {}}
        statusFilter=""
        setStatusFilter={() => {}}
      />,
    );

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("acme-corp")).toBeInTheDocument();
    expect(screen.getByText("Beta LLC")).toBeInTheDocument();
  });

  it("renders QuotaConfigCard and allows input changes", async () => {
    const handleSave = vi.fn().mockResolvedValue({});
    const mockConfig = {
      rate_limit_rpm: 1000,
      storage_quota_gb: 50,
      feature_flags: { custom_domain: true },
    };

    render(
      <QuotaConfigCard
        tenantId="tenant-1"
        config={mockConfig}
        onSave={handleSave}
      />,
    );

    expect(
      screen.getByText("Tenant Quota & Feature Flags"),
    ).toBeInTheDocument();
    expect(screen.getByText("1000 req/min")).toBeInTheDocument();
  });

  it("renders UserRbacTable and handles user list", () => {
    const mockUsers = [
      {
        id: "u1",
        user_id: "u1",
        full_name: "Alice",
        email: "alice@acme.com",
        role: "Tenant Owner",
        status: "Active",
      },
    ];

    render(
      <UserRbacTable
        tenantId="tenant-1"
        users={mockUsers}
        loading={false}
        onInviteUser={vi.fn()}
        onRevokeUser={vi.fn()}
      />,
    );

    expect(screen.getByText("Users & Tenant RBAC")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("alice@acme.com")).toBeInTheDocument();
  });

  it("renders AuditLogViewer and displays audit entries", () => {
    const mockLogs = [
      {
        id: "log-1",
        tenant_id: "tenant-1",
        actor_id: "admin-1",
        action: "TENANT_ONBOARDED",
        entity_type: "Tenant",
        details: { foo: "bar" },
        created_at: "2026-01-01T12:00:00Z",
      },
    ];

    render(<AuditLogViewer auditLogs={mockLogs} loading={false} />);
    expect(
      screen.getByText("Write-Once Immutable Audit Log"),
    ).toBeInTheDocument();
    expect(screen.getByText("TENANT_ONBOARDED")).toBeInTheDocument();
  });
});
