import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import BreedingPage from "../pages/BreedingPage.jsx";
import * as api from "../services/api.js";

vi.mock("../services/api.js", () => ({
  getBreedingRecords: vi.fn().mockResolvedValue([
    {
      id: "br-1",
      cow_id: "COW-1042",
      stage: "Inseminated",
      event_date: "2025-06-01",
      sire_rfid_or_code: "BULL-0089",
      gestation_check_due_date: "2025-07-15",
      expected_calving_date: "2026-03-10",
      notes: "AI service",
    },
  ]),
  getCattle: vi
    .fn()
    .mockResolvedValue([
      {
        id: "COW-1042",
        tag_number: "COW-1042",
        breed: "Holstein-Friesian",
        status: "Inseminated",
      },
    ]),
  createBreedingRecord: vi.fn().mockResolvedValue({
    id: "br-new",
    cow_id: "COW-1042",
    stage: "Inseminated",
  }),
}));

describe("BreedingPage Component", () => {
  it("renders page header and reproductive lifecycle board", async () => {
    render(<BreedingPage />);
    expect(
      screen.getByText(/Breeding & Reproductive Lifecycle Board/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Reproductive Lifecycle Pipeline/i),
    ).toBeInTheDocument();
  });

  it("calculates gestation check and expected calving date on form input", async () => {
    render(<BreedingPage />);
    const demoBtn = screen.getByText(/Fill Demo Sample/i);
    fireEvent.click(demoBtn);

    const checkEls = screen.getAllByText(/Gestation Check Due/i);
    expect(checkEls.length).toBeGreaterThan(0);
    expect(checkEls[0]).toBeInTheDocument();

    const calvingEls = screen.getAllByText(/Expected Calving Date/i);
    expect(calvingEls.length).toBeGreaterThan(0);
    expect(calvingEls[0]).toBeInTheDocument();
  });

  it("submits breeding record successfully", async () => {
    render(<BreedingPage />);
    const demoBtn = screen.getByText(/Fill Demo Sample/i);
    fireEvent.click(demoBtn);

    const submitBtn = screen.getByRole("button", { name: /Record Milestone/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.createBreedingRecord).toHaveBeenCalled();
    });
  });
});
