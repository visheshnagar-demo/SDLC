import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import SubjectInputForm from "../components/SubjectInputForm";
import SubjectTable from "../components/SubjectTable";
import AvailabilityGrid from "../components/AvailabilityGrid";

describe("SubjectInputForm Component", () => {
  it("renders all form inputs and submit button", () => {
    render(<SubjectInputForm onAddSubject={vi.fn()} isLoading={false} />);

    expect(screen.getByLabelText(/Subject Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Estimated Total Hours/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Exam/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Add Subject/i }),
    ).toBeInTheDocument();
  });

  it("submits the form with provided values", async () => {
    const handleAdd = vi.fn().mockResolvedValue({});
    render(<SubjectInputForm onAddSubject={handleAdd} isLoading={false} />);

    const nameInput = screen.getByLabelText(/Subject Name/i);
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "Linear Algebra" } });
    });

    const submitBtn = screen.getByRole("button", { name: /Add Subject/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(handleAdd).toHaveBeenCalledTimes(1);
    expect(handleAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Linear Algebra",
        difficulty_level: 3,
      }),
    );
  });
});

describe("SubjectTable Component", () => {
  const mockSubjects = [
    {
      id: "subj-1",
      name: "Calculus III",
      difficulty_level: 4,
      target_date: "2026-12-15",
      estimated_total_hours: 30,
      color_tag: "#2563EB",
    },
    {
      id: "subj-2",
      name: "Database Systems",
      difficulty_level: 2,
      target_date: "2026-11-20",
      estimated_total_hours: 20,
      color_tag: "#7C3AED",
    },
  ];

  it("renders table with subject items and columns", () => {
    render(
      <SubjectTable
        subjects={mockSubjects}
        selectedSubjectIds={["subj-1"]}
        onToggleSelect={vi.fn()}
        onDeleteSubject={vi.fn()}
      />,
    );

    expect(screen.getByText("Calculus III")).toBeInTheDocument();
    expect(screen.getByText("Database Systems")).toBeInTheDocument();
    expect(screen.getByText("30h")).toBeInTheDocument();
    expect(screen.getByText("20h")).toBeInTheDocument();
  });

  it("shows empty state when no subjects provided", () => {
    render(<SubjectTable subjects={[]} />);
    expect(screen.getByText(/No subjects added yet/i)).toBeInTheDocument();
  });
});

describe("AvailabilityGrid Component", () => {
  it("renders weekly days and save button", () => {
    render(
      <AvailabilityGrid
        initialAvailability={[]}
        onSaveAvailability={vi.fn()}
        isLoading={false}
      />,
    );

    expect(screen.getByText("Monday")).toBeInTheDocument();
    expect(screen.getByText("Sunday")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Save Availability Profile/i }),
    ).toBeInTheDocument();
  });
});
