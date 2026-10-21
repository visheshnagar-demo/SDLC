import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import DigitalPassCard from "../components/DigitalPassCard";

describe("DigitalPassCard", () => {
  const mockPass = {
    id: "pass-test-123",
    pass_number: "GB-2026-X812",
    event_title: "Navratri Mahotsav Celebration",
    tier_name: "SEASON PASS - ALL 9 NIGHTS",
    attendee_name: "Aarav Patel",
    assigned_gate: "Gate 3 VIP",
    valid_until: "Oct 15 - Oct 24, 2026",
    status: "ACTIVE",
    qr_signature_hash: "HMAC_SHA256:GB-2026-X812:MOCK_VALID_HASH_FOR_TEST",
  };

  it("renders pass details, attendee name, and HMAC SHA-256 security label", () => {
    render(<DigitalPassCard pass={mockPass} />);

    expect(screen.getByText("GB-2026-X812")).toBeInTheDocument();
    expect(screen.getByText("Aarav Patel")).toBeInTheDocument();
    expect(
      screen.getByText("Navratri Mahotsav Celebration"),
    ).toBeInTheDocument();
    expect(screen.getByText(/HMAC SHA-256 SIGNED/i)).toBeInTheDocument();
    expect(
      screen.getByText(/ACTIVE \/ READY FOR GATE SCAN/i),
    ).toBeInTheDocument();
  });

  it("copies token when copy button clicked", () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });

    render(<DigitalPassCard pass={mockPass} />);
    const copyButton = screen.getByRole("button", { name: /Copy Token/i });
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining("HMAC_SHA256"),
    );
  });
});
