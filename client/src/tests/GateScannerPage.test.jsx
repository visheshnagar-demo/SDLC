import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import GateScannerPage from "../pages/GateScannerPage";
import ScanStatusAlert from "../components/ScanStatusAlert";
import GateScannerViewfinder from "../components/GateScannerViewfinder";

describe("GateScannerPage & Components", () => {
  it("renders scanner title, optical viewfinder, and gate buttons", () => {
    render(<GateScannerPage />);

    expect(screen.getByText(/Gate Checkpoint Scanner/i)).toBeInTheDocument();
    expect(screen.getByText(/Optical Viewfinder/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Gate 1 North/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Gate 3 VIP/i).length).toBeGreaterThan(0);
  });

  it("renders valid access granted status alert properly", () => {
    const validResult = {
      status: "VALID",
      message: "HMAC SHA-256 signature verified. Access granted to arena.",
      attendeeName: "Aarav Patel",
      tierName: "Season VIP Pass",
      gateIdentifier: "Gate 1 North",
      checkedInAt: "19:00:00",
    };

    render(<ScanStatusAlert result={validResult} />);

    expect(screen.getAllByText(/VALID ENTRY/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ACCESS GRANTED/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Aarav Patel")).toBeInTheDocument();
  });

  it("renders duplicate scan denied status alert properly", () => {
    const duplicateResult = {
      status: "ALREADY_USED",
      message: "Duplicate entry scan prevented! Pass already checked in.",
      attendeeName: "Duplicate Account",
      tierName: "Single-Day Pass",
      gateIdentifier: "Gate 1 North",
      checkedInAt: "18:22:15",
    };

    render(<ScanStatusAlert result={duplicateResult} />);

    expect(screen.getAllByText(/ALREADY USED/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/ACCESS DENIED • DUPLICATE ENTRY/i).length,
    ).toBeGreaterThan(0);
  });

  it("calls onScan callback when viewfinder quick test button clicked", () => {
    const handleScan = vi.fn();
    render(
      <GateScannerViewfinder
        onScan={handleScan}
        isScanning={false}
        gateName="Gate 1 North"
      />,
    );

    const quickTrigger = screen.getByText(/Valid Season Pass/i);
    fireEvent.click(quickTrigger);

    expect(handleScan).toHaveBeenCalledWith(
      expect.stringContaining("HMAC_SHA256"),
    );
  });
});
