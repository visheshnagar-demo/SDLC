import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TrackCard from "./TrackCard";

describe("TrackCard Component", () => {
  const mockTrack = {
    id: "track-1",
    title: "Mathematics for Machine Learning",
    slug: "mathematics-for-machine-learning",
    description:
      "Foundational linear algebra, vector calculus, and probability.",
    difficulty: "Beginner",
    estimated_hours: 12,
    modules_count: 6,
    tags: ["LinearAlgebra", "Calculus"],
  };

  it("renders track title, difficulty, and description", () => {
    render(
      <MemoryRouter>
        <TrackCard track={mockTrack} />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Mathematics for Machine Learning"),
    ).toBeInTheDocument();
    expect(screen.getByText("Beginner")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Foundational linear algebra, vector calculus, and probability.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Start Track")).toBeInTheDocument();
    expect(screen.getByText("Curriculum")).toBeInTheDocument();
  });

  it("calls onStart handler when Start Track button is clicked", () => {
    const onStartMock = vi.fn();
    render(
      <MemoryRouter>
        <TrackCard track={mockTrack} onStart={onStartMock} />
      </MemoryRouter>,
    );

    const startButton = screen.getByText("Start Track");
    fireEvent.click(startButton);
    expect(onStartMock).toHaveBeenCalledTimes(1);
    expect(onStartMock).toHaveBeenCalledWith(mockTrack);
  });
});
