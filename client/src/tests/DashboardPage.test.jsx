import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import DashboardPage from "../pages/DashboardPage";
import emailService from "../services/api";

vi.mock("../services/api", () => ({
  default: {
    getEmails: vi.fn(),
  },
}));

describe("DashboardPage Component", () => {
  it("renders dashboard with KPI cards and table", async () => {
    emailService.getEmails.mockResolvedValueOnce({
      items: [
        {
          id: "test-1",
          subject: "Team Lunch Friday",
          category: "Personal",
          confidence_score: 0.88,
          status: "PROCESSED",
        },
      ],
      total: 1,
    });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    expect(
      screen.getByText("Classification Review Dashboard"),
    ).toBeInTheDocument();
    expect(screen.getByText("Total Emails")).toBeInTheDocument();
    expect(screen.getAllByText("Urgent").length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getByText("Team Lunch Friday")).toBeInTheDocument();
    });
  });
});
