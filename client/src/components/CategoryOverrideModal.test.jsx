import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CategoryOverrideModal } from "./CategoryOverrideModal";

describe("CategoryOverrideModal Component", () => {
  const mockEmail = {
    id: "test-email-123",
    subject: "Urgent Server Maintenance",
    sender: "ops@company.com",
    body_text: "Please restart all worker nodes immediately.",
    source_type: "TEXT_ENTRY",
    created_at: "2026-09-10T12:00:00Z",
    classification: {
      ai_category: "Urgent",
      confidence_score: 95.5,
      is_overridden: false,
    },
  };

  it("renders modal with email details and category buttons", () => {
    render(
      <CategoryOverrideModal
        email={mockEmail}
        onClose={vi.fn()}
        onOverrideSuccess={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Email Inspection & Category Override"),
    ).toBeInTheDocument();
    expect(screen.getByText("Urgent Server Maintenance")).toBeInTheDocument();
    expect(screen.getByText("ops@company.com")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Confirm Override/i }),
    ).toBeInTheDocument();
  });

  it("allows clicking different categories", () => {
    render(
      <CategoryOverrideModal
        email={mockEmail}
        onClose={vi.fn()}
        onOverrideSuccess={vi.fn()}
      />,
    );

    const workButton = screen.getByRole("button", { name: "Work" });
    fireEvent.click(workButton);
    expect(workButton).toBeInTheDocument();
  });

  it("calls onClose when Cancel button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <CategoryOverrideModal
        email={mockEmail}
        onClose={handleClose}
        onOverrideSuccess={vi.fn()}
      />,
    );

    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
