import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import DetailPage from "../pages/DetailPage";
import emailService from "../services/api";

vi.mock("../services/api", () => ({
  default: {
    getEmailById: vi.fn(),
    overrideCategory: vi.fn(),
  },
}));

describe("DetailPage Component", () => {
  it("loads and renders email details", async () => {
    const mockEmail = {
      id: "email-uuid-555",
      subject: "Security Patch Announcement",
      body: "All engineers must apply the latest patch immediately.",
      category: "Work",
      confidence_score: 0.94,
      status: "PROCESSED",
      is_overridden: false,
    };

    emailService.getEmailById.mockResolvedValueOnce(mockEmail);

    render(
      <MemoryRouter initialEntries={["/emails/email-uuid-555"]}>
        <Routes>
          <Route path="/emails/:id" element={<DetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Security Patch Announcement"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "All engineers must apply the latest patch immediately.",
        ),
      ).toBeInTheDocument();
      expect(screen.getByText("Email Metadata")).toBeInTheDocument();
      expect(screen.getByText("Classification Details")).toBeInTheDocument();
    });
  });
});
