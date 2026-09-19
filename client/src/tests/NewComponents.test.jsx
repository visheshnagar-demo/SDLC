import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import Dashboard from "../components/Dashboard";
import DeviceCatalog from "../components/DeviceCatalog";
import DeviceDetailModal from "../components/DeviceDetailModal";
import AssignmentModal from "../components/AssignmentModal";
import PolicyManager from "../components/PolicyManager";
import AuditLogViewer from "../components/AuditLogViewer";

describe("New Components Unit Tests", () => {
  it("renders Dashboard component", () => {
    const analytics = {
      total_devices: 10,
      active_assignments: 6,
      available_devices: 4,
      non_compliant_count: 1,
      os_distribution: { iOS: 6, Android: 4 },
      ownership_distribution: { Corporate: 8, BYOD: 2 },
    };
    render(<Dashboard analytics={analytics} loading={false} error={null} />);
    expect(screen.getByText("Total Mobile Assets")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders DeviceCatalog with devices", () => {
    const devices = [
      {
        id: "d1",
        model: "iPhone 15",
        manufacturer: "Apple",
        imei: "12345",
        serial_number: "SN123",
        os_type: "iOS",
        os_version: "17.0",
        ownership_type: "Corporate",
        status: "Available",
        is_compliant: true,
      },
    ];
    render(<DeviceCatalog devices={devices} loading={false} />);
    expect(screen.getByText("iPhone 15")).toBeInTheDocument();
  });

  it("renders DeviceDetailModal", () => {
    const device = {
      id: "d1",
      model: "iPhone 15",
      manufacturer: "Apple",
      os_type: "iOS",
      os_version: "17.0",
      serial_number: "SN123",
      imei: "12345",
      ownership_type: "Corporate",
      status: "Available",
      is_encrypted: true,
      passcode_enforced: true,
      is_compliant: true,
    };
    render(<DeviceDetailModal device={device} onClose={() => {}} />);
    expect(screen.getByText("iPhone 15")).toBeInTheDocument();
    expect(screen.getByText("Remote Management Commands")).toBeInTheDocument();
  });

  it("renders PolicyManager", () => {
    const policies = [
      {
        id: "p1",
        name: "Corporate Security Baseline",
        min_os_version_ios: "17.0",
        min_os_version_android: "14.0",
        require_encryption: true,
        require_passcode: true,
        is_active: true,
      },
    ];
    render(<PolicyManager policies={policies} />);
    expect(screen.getByText("Corporate Security Baseline")).toBeInTheDocument();
  });

  it("renders AuditLogViewer", () => {
    render(<AuditLogViewer />);
    expect(screen.getByText("Administrative Audit Logs")).toBeInTheDocument();
  });
});
