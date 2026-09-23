import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ManualOverrideModal from "../components/ManualOverrideModal";
import emailService from "../services/api";

vi.mock("../services/api", () => ({
  default: {
    overrideCategory: vi.fn(),
  },
}));

describe("ManualOverrideModal Component", () => {
  const mockEmail = {
    id: "test-uuid-123",
    subject: "Urgent Server Outage",
    category: "Work",
    confidence_score: 0.85,
  };

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <ManualOverrideModal
        isOpen={false}
        email={mockEmail}
        onClose={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal with email details and category select when isOpen is true", () => {
    render(
      <ManualOverrideModal isOpen={true} email={mockEmail} onClose={vi.fn()} />,
    );

    expect(screen.getByText("Manual Category Override")).toBeInTheDocument();
    expect(screen.getByText("Urgent Server Outage")).toBeInTheDocument();
    expect(screen.getByLabelText(/New Category/i)).toBeInTheDocument();
  });

  it("submits category override and calls onSaved", async () => {
    const onSavedMock = vi.fn();
    const onCloseMock = vi.fn();
    const updatedEmail = {
      ...mockEmail,
      category: "Urgent",
      is_overridden: true,
    };

    emailService.overrideCategory.mockResolvedValueOnce(updatedEmail);

    render(
      <ManualOverrideModal
        isOpen={true}
        email={mockEmail}
        onClose={onCloseMock}
        onSaved={onSavedMock}
      />,
    );

    fireEvent.change(screen.getByLabelText(/New Category/i), {
      target: { value: "Urgent" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save Override/i }));

    await waitFor(() => {
      expect(emailService.overrideCategory).toHaveBeenCalledWith(
        "test-uuid-123",
        {
          category: "Urgent",
          notes: undefined,
        },
      );
      expect(onSavedMock).toHaveBeenCalledWith(updatedEmail);
      expect(onCloseMock).toHaveBeenCalled();
    });
  });
});
