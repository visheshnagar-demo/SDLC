import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HealthEquipmentPage from "../pages/HealthEquipmentPage";
import FishHealthTable from "../components/health/FishHealthTable";
import EquipmentCard from "../components/equipment/EquipmentCard";
import * as api from "../services/api";

vi.mock("../services/api", () => ({
  getTanks: vi.fn(),
  getHealthRecords: vi.fn(),
  getEquipment: vi.fn(),
  createHealthRecord: vi.fn(),
  createEquipment: vi.fn(),
  createMaintenanceLog: vi.fn(),
}));

describe("Health & Equipment Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getTanks.mockResolvedValue([
      { id: "tank-1", name: "Tank 1 - Reef", water_type: "Saltwater" },
    ]);
    api.getHealthRecords.mockResolvedValue([
      {
        id: "h-1",
        tank_id: "tank-1",
        species: "Neon Tetra",
        population_count: 10,
        health_status: "Healthy",
        symptoms: null,
        treatment_notes: "Routine check",
        is_quarantined: false,
        recorded_by: "Dr. Elena Rostova",
      },
    ]);
    api.getEquipment.mockResolvedValue([
      {
        id: "eq-1",
        tank_id: "tank-1",
        name: "Canister Filter B2",
        equipment_type: "Canister Filter",
        model_number: "Fluval FX6",
        maintenance_interval_days: 30,
        next_due_at: "2026-10-25T00:00:00Z",
        status: "OPERATIONAL",
      },
    ]);
  });

  it("renders FishHealthTable with records", () => {
    const records = [
      {
        id: "1",
        species: "Discus",
        population_count: 5,
        health_status: "Monitoring",
        is_quarantined: true,
        recorded_by: "Staff",
      },
    ];
    render(<FishHealthTable records={records} onAddRecord={vi.fn()} />);

    expect(
      screen.getByText("Fish Population & Health Observations"),
    ).toBeInTheDocument();
    expect(screen.getByText("Discus")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Monitoring")).toBeInTheDocument();
    expect(screen.getByText("ISOLATED")).toBeInTheDocument();
  });

  it("renders EquipmentCard with equipment details", () => {
    const eq = {
      id: "eq-1",
      name: "Main Return Pump",
      equipment_type: "Water Pump",
      maintenance_interval_days: 60,
      next_due_at: "2026-12-01T00:00:00Z",
      status: "OPERATIONAL",
    };
    render(<EquipmentCard equipment={eq} onLogMaintenance={vi.fn()} />);

    expect(screen.getByText("Main Return Pump")).toBeInTheDocument();
    expect(screen.getByText("Water Pump")).toBeInTheDocument();
    expect(screen.getByText("60 Days")).toBeInTheDocument();
    expect(screen.getByText("OPERATIONAL")).toBeInTheDocument();
  });

  it("renders HealthEquipmentPage without crashing and displays census and equipment hub", async () => {
    render(
      <MemoryRouter>
        <HealthEquipmentPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Biota Health & Equipment Lifecycle Hub/i),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("TOTAL BIOTA")).toBeInTheDocument();
      expect(screen.getByText("EQUIPMENT ASSETS")).toBeInTheDocument();
      expect(
        screen.getByText(/Life-Support Equipment Maintenance Lifecycle/i),
      ).toBeInTheDocument();
    });
  });
});
