import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";
import TenantDashboardTable from "../components/tenants/TenantDashboardTable";
import TenantOnboardingForm from "../components/tenants/TenantOnboardingForm";
import QuotaTelemetryMeters from "../components/tenants/QuotaTelemetryMeters";
import TenantConfigPanel from "../components/tenants/TenantConfigPanel";

const sampleTenant = {
  id: "tenant-uuid-101",
  name: "Acme Corporation",
  slug: "acme-corp",
  status: "Active",
  tier: "Enterprise",
  admin_email: "admin@acme.com",
  max_users: 500,
  storage_limit_gb: 1000,
  rate_limit_rpm: 5000,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  configuration: {
    id: "cfg-101",
    tenant_id: "tenant-uuid-101",
    custom_domain: "portal.acme.com",
    logo_url: "https://assets.acme.com/logo.png",
    primary_theme_color: "#0055FF",
    saml_sso_config: '{"sso_url": "https://idp.acme.com/sso"}',
  },
};

describe("Tenant Management UI Components", () => {
  it("renders TenantDashboardTable with tenant items", () => {
    render(
      <BrowserRouter>
        <TenantDashboardTable tenants={[sampleTenant]} />
      </BrowserRouter>,
    );

    expect(screen.getByText("Acme Corporation")).toBeInTheDocument();
    expect(screen.getByText("slug: acme-corp")).toBeInTheDocument();
    expect(screen.getByText("admin@acme.com")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Enterprise")).toBeInTheDocument();
  });

  it("renders empty state when tenant list is empty", () => {
    render(
      <BrowserRouter>
        <TenantDashboardTable tenants={[]} />
      </BrowserRouter>,
    );

    expect(screen.getByText("No Tenants Found")).toBeInTheDocument();
  });

  it("renders TenantOnboardingForm and submits form data", () => {
    const handleSubmit = vi.fn();

    render(<TenantOnboardingForm onSubmit={handleSubmit} />);

    expect(
      screen.getByText("Onboard New Tenant Organization"),
    ).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText("e.g. Acme Corporation");
    const adminInput = screen.getByPlaceholderText("e.g. admin@acme.com");

    fireEvent.change(nameInput, {
      target: { name: "name", value: "Beta Corp" },
    });
    fireEvent.change(adminInput, {
      target: { name: "admin_email", value: "admin@betacorp.com" },
    });

    const submitBtn = screen.getByRole("button", {
      name: /create organization/i,
    });
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Beta Corp",
        admin_email: "admin@betacorp.com",
      }),
    );
  });

  it("renders QuotaTelemetryMeters with consumption bars", () => {
    render(<QuotaTelemetryMeters tenant={sampleTenant} />);

    expect(
      screen.getByText("Quota Telemetry & Consumption"),
    ).toBeInTheDocument();
    expect(screen.getByText("User Seats")).toBeInTheDocument();
    expect(screen.getByText("Storage Usage")).toBeInTheDocument();
    expect(screen.getByText("API Velocity")).toBeInTheDocument();
    expect(screen.getByText("Limit: 500 seats")).toBeInTheDocument();
  });

  it("renders TenantConfigPanel and updates branding config", () => {
    const handleSave = vi.fn();

    render(
      <TenantConfigPanel
        tenant={sampleTenant}
        config={sampleTenant.configuration}
        onSave={handleSave}
      />,
    );

    expect(
      screen.getByText("Branding, Custom Domain & SAML SSO"),
    ).toBeInTheDocument();

    const domainInput = screen.getByPlaceholderText("portal.acme.com");
    expect(domainInput).toHaveValue("portal.acme.com");

    const saveBtn = screen.getByRole("button", { name: /save configuration/i });
    fireEvent.click(saveBtn);

    expect(handleSave).toHaveBeenCalledTimes(1);
  });
});
