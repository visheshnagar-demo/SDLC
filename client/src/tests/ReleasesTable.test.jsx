import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import ReleasesTable from "../components/releases/ReleasesTable";

describe("ReleasesTable Component", () => {
  const mockReleases = [
    {
      id: "rel-1",
      name: "Release v1.2.0 - Core Sync",
      semver: "v1.2.0",
      status: "In Progress",
      target_date: "2026-06-30T00:00:00Z",
      target_environments: ["Development", "QA", "Staging"],
      readiness_percentage: 75,
      unresolved_blockers: 0,
      description: "Core banking sync release",
    },
    {
      id: "rel-2",
      name: "Release v1.3.0 - Notifications",
      semver: "v1.3.0",
      status: "Draft",
      target_date: "2026-07-15T00:00:00Z",
      target_environments: ["Development"],
      readiness_percentage: 20,
      unresolved_blockers: 1,
      description: "Notification gateway rollout",
    },
  ];

  it("renders release items and version chips", () => {
    render(
      <BrowserRouter>
        <ReleasesTable releases={mockReleases} />
      </BrowserRouter>,
    );

    expect(screen.getByText("Release v1.2.0 - Core Sync")).toBeInTheDocument();
    expect(screen.getByText("v1.2.0")).toBeInTheDocument();
    expect(
      screen.getByText("Release v1.3.0 - Notifications"),
    ).toBeInTheDocument();
    expect(screen.getByText("v1.3.0")).toBeInTheDocument();
  });

  it("filters releases by search term", () => {
    render(
      <BrowserRouter>
        <ReleasesTable releases={mockReleases} />
      </BrowserRouter>,
    );

    const searchInput = screen.getByPlaceholderText(
      /search releases by name or semver/i,
    );
    fireEvent.change(searchInput, { target: { value: "Notifications" } });

    expect(
      screen.queryByText("Release v1.2.0 - Core Sync"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Release v1.3.0 - Notifications"),
    ).toBeInTheDocument();
  });

  it("shows empty state when no releases are provided", () => {
    render(
      <BrowserRouter>
        <ReleasesTable releases={[]} />
      </BrowserRouter>,
    );

    expect(screen.getByText("No releases found")).toBeInTheDocument();
  });
});
