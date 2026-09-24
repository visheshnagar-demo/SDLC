import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import EnvironmentalDashboard from "../components/EnvironmentalDashboard";

describe("EnvironmentalDashboard Component", () => {
  const mockLocations = [
    {
      id: "loc-1",
      name: "Gallery 1 (Classical Antiquities)",
      zone_type: "Display Gallery",
      temp_min_celsius: 18.0,
      temp_max_celsius: 22.0,
      humidity_min_percent: 45.0,
      humidity_max_percent: 55.0,
    },
    {
      id: "loc-2",
      name: "Storage Vault A (Textiles)",
      zone_type: "Climate Vault",
      temp_min_celsius: 16.0,
      temp_max_celsius: 19.0,
      humidity_min_percent: 40.0,
      humidity_max_percent: 50.0,
    },
  ];

  const mockReadings = [
    {
      id: "read-1",
      location_id: "loc-1",
      temperature_celsius: 20.5,
      humidity_percentage: 48.0,
      is_breach: false,
    },
    {
      id: "read-2",
      location_id: "loc-2",
      temperature_celsius: 24.5,
      humidity_percentage: 68.2,
      is_breach: true,
    },
  ];

  it("renders summary KPI metric cards", () => {
    render(
      <EnvironmentalDashboard
        artifacts={[{ id: "1" }]}
        locations={mockLocations}
        readings={mockReadings}
      />,
    );

    expect(screen.getByText(/Total Artifacts/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Sensors/i)).toBeInTheDocument();
    expect(screen.getByText(/Micro-Climate Breaches/i)).toBeInTheDocument();
  });

  it("renders live telemetry sensor cards with normal and breach states", () => {
    render(
      <EnvironmentalDashboard
        locations={mockLocations}
        readings={mockReadings}
      />,
    );

    expect(
      screen.getByText(/Gallery 1 \(Classical Antiquities\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Storage Vault A \(Textiles\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Normal")).toBeInTheDocument();
    expect(screen.getByText("BREACH")).toBeInTheDocument();
  });

  it("navigates when curatorial quick action buttons are clicked", () => {
    const handleNavigate = vi.fn();
    render(
      <EnvironmentalDashboard
        locations={mockLocations}
        readings={mockReadings}
        onNavigate={handleNavigate}
      />,
    );

    const recordBtn = screen.getByRole("button", {
      name: /Record Conservation Treatment/i,
    });
    fireEvent.click(recordBtn);
    expect(handleNavigate).toHaveBeenCalledWith("restorations");
  });
});
