import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FlowerTable from "./FlowerTable";

describe("FlowerTable Component", () => {
  const mockFlowers = [
    {
      id: "1",
      name: "Red Roses",
      species: "Rosa rubiginosa",
      color: "Red",
      price_per_stem: 2.5,
      stock_quantity: 500,
      low_stock_threshold: 20,
      freshness_date: "2026-06-01",
      care_instructions: "Keep in cool water",
    },
    {
      id: "2",
      name: "White Lilies",
      species: "Lilium candidum",
      color: "White",
      price_per_stem: 3.0,
      stock_quantity: 15,
      low_stock_threshold: 20,
      freshness_date: "2026-06-02",
      care_instructions: "Trim stems daily",
    },
  ];

  it("renders table with flower rows", () => {
    render(<FlowerTable flowers={mockFlowers} />);

    expect(screen.getByText("Red Roses")).toBeInTheDocument();
    expect(screen.getByText("White Lilies")).toBeInTheDocument();
    expect(screen.getByText("$2.50")).toBeInTheDocument();
  });
});
