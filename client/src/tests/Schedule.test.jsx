import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ScheduleTimetable from "../components/ScheduleTimetable";
import TodayProgressWidget from "../components/TodayProgressWidget";

describe("ScheduleTimetable Component", () => {
  const mockSubjects = [{ id: "s1", name: "Algorithms", color_tag: "#2563EB" }];

  const mockSessions = [
    {
      id: "sess-1",
      subject_id: "s1",
      session_date: "2026-10-01",
      start_time: "09:00 AM",
      duration_minutes: 90,
      topic_focus: "Divide and Conquer",
      status: "PENDING",
    },
  ];

  it("renders session cards and action buttons", () => {
    render(
      <ScheduleTimetable
        sessions={mockSessions}
        subjects={mockSubjects}
        onUpdateStatus={vi.fn()}
      />,
    );

    expect(screen.getAllByText("Algorithms").length).toBeGreaterThan(0);
    expect(screen.getByText(/Divide and Conquer/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Mark Complete/i }),
    ).toBeInTheDocument();
  });

  it("calls onUpdateStatus when status button clicked", () => {
    const handleStatus = vi.fn();
    render(
      <ScheduleTimetable
        sessions={mockSessions}
        subjects={mockSubjects}
        onUpdateStatus={handleStatus}
      />,
    );

    const completeBtn = screen.getByRole("button", { name: /Mark Complete/i });
    fireEvent.click(completeBtn);

    expect(handleStatus).toHaveBeenCalledWith("sess-1", "COMPLETED");
  });

  it("displays empty state when sessions are empty", () => {
    render(<ScheduleTimetable sessions={[]} subjects={[]} />);
    expect(
      screen.getByText(/No Study Schedule Generated Yet/i),
    ).toBeInTheDocument();
  });
});

describe("TodayProgressWidget Component", () => {
  it("renders today progress metrics", () => {
    render(
      <TodayProgressWidget
        sessions={[
          { id: "1", status: "COMPLETED", duration_minutes: 60 },
          { id: "2", status: "PENDING", duration_minutes: 60 },
        ]}
        subjects={[]}
      />,
    );

    expect(screen.getByText(/Today's Study Progress/i)).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });
});
