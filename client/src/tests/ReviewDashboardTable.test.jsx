import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ReviewDashboardTable from "../components/ReviewDashboardTable";

describe("ReviewDashboardTable Component", () => {
  const mockEmails = [
    {
      id: "email-1",
      subject: "Quarterly Review Meeting",
      preview: "Please find attached the Q3 financial slides...",
      category: "Work",
      confidence_score: 0.92,
      status: "PROCESSED",
      file_type: "txt",
      created_at: "2026-09-23T10:00:00Z",
    },
    {
      id: "email-2",
      subject: "50% Off Flash Sale",
      preview: "Exclusive discounts on all tech gear...",
      category: "Promotional",
      confidence_score: 0.98,
      status: "PROCESSED",
      file_type: "eml",
      created_at: "2026-09-23T11:00:00Z",
    },
  ];

  it("renders table rows with emails", () => {
    render(
      <ReviewDashboardTable
        emails={mockEmails}
        total={2}
        search=""
        onSearchChange={vi.fn()}
        categoryFilter="All"
        onCategoryChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Quarterly Review Meeting")).toBeInTheDocument();
    expect(screen.getByText("50% Off Flash Sale")).toBeInTheDocument();
  });

  it("renders empty state when no emails are present", () => {
    render(
      <ReviewDashboardTable
        emails={[]}
        total={0}
        search=""
        onSearchChange={vi.fn()}
        categoryFilter="All"
        onCategoryChange={vi.fn()}
      />,
    );

    expect(screen.getByText("No emails found")).toBeInTheDocument();
  });

  it("triggers onView and onOverride callbacks on button clicks", () => {
    const onViewMock = vi.fn();
    const onOverrideMock = vi.fn();

    render(
      <ReviewDashboardTable
        emails={mockEmails}
        total={2}
        onView={onViewMock}
        onOverride={onOverrideMock}
        search=""
        onSearchChange={vi.fn()}
        categoryFilter="All"
        onCategoryChange={vi.fn()}
      />,
    );

    const viewButtons = screen.getAllByRole("button", { name: /View/i });
    fireEvent.click(viewButtons[0]);
    expect(onViewMock).toHaveBeenCalledWith("email-1");

    const overrideButtons = screen.getAllByRole("button", {
      name: /Override/i,
    });
    fireEvent.click(overrideButtons[0]);
    expect(onOverrideMock).toHaveBeenCalledWith(mockEmails[0]);
  });
});
