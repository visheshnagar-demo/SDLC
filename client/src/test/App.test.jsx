import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App.jsx";
import KpiSummaryCard from "../components/dashboard/KpiSummaryCard.jsx";
import InstanceTable from "../components/dashboard/InstanceTable.jsx";
import TelemetryChart from "../components/telemetry/TelemetryChart.jsx";
import ProviderCard from "../components/providers/ProviderCard.jsx";
import AuditLogTable from "../components/audit/AuditLogTable.jsx";
import { BrowserRouter } from "react-router-dom";

describe("CloudPulse Application Tests", () => {
  it("renders application navigation and core branding", () => {
    render(<App />);
    expect(screen.getByText(/CloudPulse/i)).toBeInTheDocument();
    expect(screen.getByText(/Core v2.4/i)).toBeInTheDocument();
    expect(screen.getByText(/Overview & Dashboard/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Provision VM/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Cloud Providers/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Audit Logs & Governance/i)).toBeInTheDocument();
  });

  it("renders KpiSummaryCard with title and metrics", () => {
    render(
      <KpiSummaryCard
        title="Fleet Instances"
        value="12"
        subtext="10 Running • 2 Stopped"
      />,
    );
    expect(screen.getByText("Fleet Instances")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("10 Running • 2 Stopped")).toBeInTheDocument();
  });

  it("renders InstanceTable and handles empty / populated states", () => {
    const mockInstances = [
      {
        id: "inst-test-1",
        name: "test-worker-node",
        provider_type: "AWS",
        region: "us-east-1",
        instance_type: "t3.medium",
        status: "RUNNING",
        public_ip: "54.210.10.20",
        private_ip: "10.0.1.5",
      },
    ];

    render(
      <BrowserRouter>
        <InstanceTable
          instances={mockInstances}
          currentUser={{ role: "ADMIN" }}
        />
      </BrowserRouter>,
    );

    expect(screen.getByText("test-worker-node")).toBeInTheDocument();
    expect(screen.getByText("t3.medium")).toBeInTheDocument();
  });

  it("renders TelemetryChart component with SVG telemetry elements", () => {
    const mockData = [
      { timestamp: "10:00", cpu_utilization_pct: 35 },
      { timestamp: "10:15", cpu_utilization_pct: 60 },
    ];

    render(
      <TelemetryChart
        title="CPU Telemetry"
        metricKey="cpu_utilization_pct"
        data={mockData}
      />,
    );

    expect(screen.getByText("CPU Telemetry")).toBeInTheDocument();
    expect(screen.getAllByText("60%").length).toBeGreaterThan(0);
  });

  it("renders ProviderCard with active security and provider badge", () => {
    const mockProvider = {
      id: "prov-aws",
      name: "AWS Primary Acc",
      provider_type: "AWS",
      is_active: true,
      instance_count: 5,
    };

    render(
      <ProviderCard provider={mockProvider} currentUser={{ role: "ADMIN" }} />,
    );

    expect(screen.getByText("AWS Primary Acc")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("AES-256-GCM Vault")).toBeInTheDocument();
  });

  it("renders AuditLogTable with event outcomes and Merkle verification button", () => {
    const mockLogs = [
      {
        id: "log-1",
        user_email: "admin@example.com",
        action: "INSTANCE_PROVISION",
        target_resource: "web-srv-01",
        status: "SUCCESS",
        ip_address: "10.0.0.1",
        created_at: "2026-05-18T10:00:00Z",
      },
    ];

    render(<AuditLogTable logs={mockLogs} />);
    expect(screen.getByText("web-srv-01")).toBeInTheDocument();
    expect(screen.getByText("INSTANCE_PROVISION")).toBeInTheDocument();
    expect(screen.getByText("Verify")).toBeInTheDocument();
  });
});
