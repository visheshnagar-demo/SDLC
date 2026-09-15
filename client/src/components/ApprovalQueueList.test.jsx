import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ApprovalQueueList from "./ApprovalQueueList";

describe("ApprovalQueueList Component", () => {
  it("renders empty queue message when no visits are present", () => {
    render(<ApprovalQueueList visits={[]} loading={false} />);
    expect(screen.getByText(/Queue is Clear!/i)).toBeInTheDocument();
  });

  it("renders visitor request card when visits exist", () => {
    const mockVisits = [
      {
        id: "visit-123",
        visitor: {
          full_name: "Bruce Wayne",
          company: "Wayne Enterprises",
          email: "bruce@wayne.com",
        },
        purpose: "Facility Inspection",
        scheduled_start_time: "2026-11-01T10:00:00Z",
        status: "PENDING_APPROVAL",
      },
    ];

    render(<ApprovalQueueList visits={mockVisits} loading={false} />);
    expect(screen.getByText("Bruce Wayne")).toBeInTheDocument();
    expect(screen.getByText("Wayne Enterprises")).toBeInTheDocument();
    expect(screen.getByText("Facility Inspection")).toBeInTheDocument();
  });
});
