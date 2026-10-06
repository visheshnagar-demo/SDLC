import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import HealthPage from "../pages/HealthPage.jsx";
import * as api from "../services/api.js";

vi.mock("../services/api.js", () => ({
  getHealthRecords: vi.fn().mockResolvedValue([
    {
      id: "hr-1",
      cow_id: "COW-1042",
      record_type: "Treatment",
      diagnosis: "Mastitis - Left Quarter",
      medication_administered: "Antibiotic X",
      dosage: "10ml",
      treatment_date: "2026-05-18T08:00:00.000Z",
      milk_withdrawal_hours: 96,
      milk_withdrawal_end: "2026-05-22T08:00:00.000Z",
      meat_withdrawal_days: 14,
      veterinarian_name: "Dr. Sarah Mitchell",
    },
  ]),
  getActiveWithdrawals: vi.fn().mockResolvedValue([
    {
      id: "wh-1",
      cow_id: "COW-1042",
      diagnosis: "Mastitis - Left Quarter",
      milk_withdrawal_end: "2026-05-22T08:00:00.000Z",
    },
  ]),
  getCattle: vi
    .fn()
    .mockResolvedValue([
      { id: "COW-1042", tag_number: "COW-1042", breed: "Holstein-Friesian" },
    ]),
  createHealthRecord: vi.fn().mockResolvedValue({
    id: "hr-new",
    cow_id: "COW-1042",
    record_type: "Treatment",
  }),
}));

describe("HealthPage Component", () => {
  it("renders page header and active milk withdrawal banner", async () => {
    render(<HealthPage />);
    expect(
      screen.getByText(/Health, Vaccination & Veterinary Withholding Tracker/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        /Active Antibiotic Milk Withholding Enforcement/i,
      ),
    ).toBeInTheDocument();
  });

  it("calculates withdrawal period and submits health record", async () => {
    render(<HealthPage />);
    const demoBtn = screen.getByText(/Fill Demo Sample/i);
    fireEvent.click(demoBtn);

    expect(
      screen.getByText(/Automated Milk Withholding Notice/i),
    ).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", {
      name: /Log Health Encounter/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.createHealthRecord).toHaveBeenCalled();
    });
  });
});
