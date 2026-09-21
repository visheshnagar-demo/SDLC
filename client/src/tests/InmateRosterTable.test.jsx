import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import InmateRosterTable from "../components/inmates/InmateRosterTable";

vi.mock("../services/api", () => ({
  getInmates: vi.fn().mockResolvedValue([
    {
      id: "inm-1",
      inmate_number: "INM-1002",
      first_name: "John",
      last_name: "Doe",
      date_of_birth: "1985-05-12",
      security_tier: "HIGH_SECURITY",
      cell_id: "C-302",
      medical_alerts: ["ASTHMA"],
    },
  ]),
}));

describe("InmateRosterTable Component", () => {
  it("renders KPI summary cards and search input", async () => {
    render(<InmateRosterTable />);
    expect(await screen.findByText(/Total Inmates/i)).toBeInView();
    expect(
      screen.getByPlaceholderText(/Search Inmate ID or Name/i),
    ).toBeInView();
  });

  it("renders inmate data from API response", async () => {
    render(<InmateRosterTable />);
    expect(await screen.findByText("John Doe")).toBeInView();
    expect(screen.getByText("INM-1002")).toBeInView();
  });
});
