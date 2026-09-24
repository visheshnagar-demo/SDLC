import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardPage from "../pages/DashboardPage";
import * as api from "../services/api";

describe("DashboardPage Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders page header and metric summaries upon loading data", async () => {
    vi.spyOn(api, "getReleases").mockResolvedValue([
      {
        id: "rel-1",
        name: "Release v1.2.0 - Core Banking",
        semver: "v1.2.0",
        status: "In Progress",
        readiness_percentage: 80,
        unresolved_blockers: 0,
      },
    ]);

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Software Releases Dashboard")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("Release v1.2.0 - Core Banking"),
      ).toBeInTheDocument();
    });
  });
});
