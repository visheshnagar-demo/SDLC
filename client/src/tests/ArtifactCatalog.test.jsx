import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ArtifactCatalog from "../components/ArtifactCatalog";

describe("ArtifactCatalog Component", () => {
  const mockArtifacts = [
    {
      id: "art-1",
      accession_no: "ART-2026-001",
      title: "Roman Terracotta Amphora",
      category: "Ceramic",
      medium: "Terracotta",
      origin: "Pompeii, Italy",
      creation_era: "1st Century CE",
      status: "On Display",
      condition_rating: "Good",
    },
    {
      id: "art-2",
      accession_no: "ART-2026-089",
      title: "Flemish Silk Tapestry Fragment",
      category: "Textile",
      medium: "Dyed Silk",
      origin: "Flanders, Belgium",
      creation_era: "15th Century",
      status: "In Storage",
      condition_rating: "Fair",
    },
  ];

  const mockLocations = [
    { id: "loc-1", name: "Gallery 1" },
    { id: "loc-2", name: "Storage Vault A" },
  ];

  it("renders catalog header and artifact cards", () => {
    render(
      <ArtifactCatalog artifacts={mockArtifacts} locations={mockLocations} />,
    );

    expect(
      screen.getByText(/Artifact Catalog & Accession Registry/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Roman Terracotta Amphora")).toBeInTheDocument();
    expect(
      screen.getByText("Flemish Silk Tapestry Fragment"),
    ).toBeInTheDocument();
    expect(screen.getByText("ART-2026-001")).toBeInTheDocument();
  });

  it("filters artifacts by search query", () => {
    render(
      <ArtifactCatalog artifacts={mockArtifacts} locations={mockLocations} />,
    );

    const searchInput = screen.getByPlaceholderText(/Search accession number/i);
    fireEvent.change(searchInput, { target: { value: "Amphora" } });

    expect(screen.getByText("Roman Terracotta Amphora")).toBeInTheDocument();
    expect(
      screen.queryByText("Flemish Silk Tapestry Fragment"),
    ).not.toBeInTheDocument();
  });

  it("calls onSelectArtifact when View Dossier is clicked", () => {
    const handleSelect = vi.fn();
    render(
      <ArtifactCatalog
        artifacts={mockArtifacts}
        locations={mockLocations}
        onSelectArtifact={handleSelect}
      />,
    );

    const dossierButtons = screen.getAllByRole("button", {
      name: /View Dossier/i,
    });
    fireEvent.click(dossierButtons[0]);

    expect(handleSelect).toHaveBeenCalledWith(mockArtifacts[0]);
  });
});
