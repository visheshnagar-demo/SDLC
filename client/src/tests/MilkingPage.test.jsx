import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MilkingPage from "../pages/MilkingPage.jsx";
import * as api from "../services/api.js";

vi.mock("../services/api.js", () => ({
  getMilkLogs: vi.fn().mockResolvedValue([
    {
      id: "ml-1",
      cow_id: "COW-1042",
      milking_date: "2026-10-06",
      session: "Morning",
      yield_liters: 18.5,
      fat_percentage: 3.8,
      protein_percentage: 3.2,
      somatic_cell_count: 150,
      is_withheld: false,
      variance_alert: false,
    },
  ]),
  getCattle: vi.fn().mockResolvedValue([
    {
      id: "COW-1042",
      tag_number: "COW-1042",
      rfid_tag: "982 000010428912",
      breed: "Holstein-Friesian",
    },
  ]),
  getActiveWithdrawals: vi.fn().mockResolvedValue([]),
  createMilkLog: vi.fn().mockResolvedValue({
    id: "ml-new",
    cow_id: "COW-1042",
    milking_date: "2026-10-06",
    session: "Morning",
    yield_liters: 18.5,
  }),
}));

describe("MilkingPage Component", () => {
  it("renders page header and session logger", async () => {
    render(<MilkingPage />);
    expect(
      screen.getByText(/Milking Operations & Logging Station/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Milking Session Logger/i)).toBeInTheDocument();
  });

  it("renders aggregate KPI summary cards", async () => {
    render(<MilkingPage />);
    expect(screen.getByText(/Today's Total Parlor Yield/i)).toBeInTheDocument();
    expect(screen.getByText(/Morning \(AM\) Volume/i)).toBeInTheDocument();
  });

  it("submits a milking entry successfully", async () => {
    render(<MilkingPage />);
    const demoBtn = screen.getByText(/Fill Demo Sample/i);
    fireEvent.click(demoBtn);

    const submitBtn = screen.getByRole("button", {
      name: /Record Milk Yield/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.createMilkLog).toHaveBeenCalled();
    });
  });
});
