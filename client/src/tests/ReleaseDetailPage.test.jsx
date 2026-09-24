import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ReleaseDetailPage from "../pages/ReleaseDetailPage";
import * as api from "../services/api";

describe("ReleaseDetailPage Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders release details, readiness score, and tab panels", async () => {
    vi.spyOn(api, "getRelease").mockResolvedValue({
      id: "rel-123",
      name: "Release v1.2.0 - Core Banking Sync",
      semver: "v1.2.0",
      status: "In Progress",
      target_date: "2026-06-30T00:00:00Z",
      target_environments: ["Development", "QA", "Staging"],
      description: "Core banking sync release.",
    });

    vi.spyOn(api, "getReleaseItems").mockResolvedValue([
      {
        id: "item-1",
        issue_key: "SCRUM-204",
        summary: "Realtime WebSocket gateway sync",
        issue_type: "Feature",
        priority: "High",
        resolution_status: "In Progress",
      },
    ]);

    vi.spyOn(api, "getReleaseReadiness").mockResolvedValue({
      total_items: 1,
      completed_items: 0,
      readiness_percentage: 0,
      unresolved_blockers: 0,
      risk_level: "LOW",
      is_ready_for_deployment: false,
    });

    vi.spyOn(api, "getDeployments").mockResolvedValue([]);
    vi.spyOn(api, "getAuditLogs").mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/releases/rel-123"]}>
        <Routes>
          <Route path="/releases/:id" element={<ReleaseDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Release v1.2.0 - Core Banking Sync"),
      ).toBeInTheDocument();
      expect(screen.getByText("v1.2.0")).toBeInTheDocument();
      expect(screen.getByText("Release Readiness Score")).toBeInTheDocument();
      expect(
        screen.getByText("Realtime WebSocket gateway sync"),
      ).toBeInTheDocument();
    });
  });
});
