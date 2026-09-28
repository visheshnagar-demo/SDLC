import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import QuizCard from "./QuizCard";

describe("QuizCard Component", () => {
  const mockQuiz = {
    id: "quiz-1",
    module_id: "m-1",
    title: "Linear Models Assessment",
    passing_score: 70,
    questions: [
      {
        id: "q1",
        question_text: "What does ordinary least squares minimize?",
        options: [
          { id: "A", text: "Sum of squared residuals" },
          { id: "B", text: "Maximum entropy loss" },
        ],
        correct_answer: "A",
        explanation:
          "OLS finds parameter vectors minimizing sum of squared differences.",
      },
    ],
  };

  it("renders question text and option choices", () => {
    render(<QuizCard quiz={mockQuiz} onComplete={vi.fn()} />);

    expect(
      screen.getByText("What does ordinary least squares minimize?"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Sum of squared residuals/i)).toBeInTheDocument();
    expect(screen.getByText(/Maximum entropy loss/i)).toBeInTheDocument();
  });

  it("shows explanation when an option is selected and allows completing quiz", () => {
    const onCompleteMock = vi.fn();
    render(<QuizCard quiz={mockQuiz} onComplete={onCompleteMock} />);

    const optionA = screen.getByText(/Sum of squared residuals/i);
    fireEvent.click(optionA);

    expect(
      screen.getByText(
        /OLS finds parameter vectors minimizing sum of squared differences/i,
      ),
    ).toBeInTheDocument();

    const submitButton = screen.getByText("Submit Assessment");
    fireEvent.click(submitButton);

    expect(onCompleteMock).toHaveBeenCalledTimes(1);
    expect(onCompleteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        quizId: "quiz-1",
        scorePercentage: 100,
        passed: true,
      }),
    );
  });
});
