import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MealLoggingCard from "../components/MealLoggingCard";
import WaterTracker from "../components/WaterTracker";
import NutrientProgressBar from "../components/NutrientProgressBar";
import AvatarCustomizer from "../components/AvatarCustomizer";
import TriviaQuizCard from "../components/TriviaQuizCard";
import ParentAnalyticsChart from "../components/ParentAnalyticsChart";

describe("Frontend UI Components", () => {
  it("renders MealLoggingCard in unlogged state and triggers quick log", () => {
    const handleQuickLog = vi.fn();
    render(
      <MealLoggingCard
        mealType="Breakfast"
        loggedMeal={null}
        onQuickLog={handleQuickLog}
      />,
    );

    expect(screen.getByText("Breakfast")).toBeInTheDocument();
    expect(screen.getByText("Not logged yet today")).toBeInTheDocument();
    const logButton = screen.getByRole("button", { name: /\+ Log Breakfast/i });
    fireEvent.click(logButton);
    expect(handleQuickLog).toHaveBeenCalledWith("Breakfast");
  });

  it("renders MealLoggingCard in logged state with food items", () => {
    const loggedMeal = {
      id: "m-1",
      items: [{ food_name: "Oatmeal & Apple", portion_size: "1 bowl" }],
      logged_at: new Date().toISOString(),
    };

    render(
      <MealLoggingCard
        mealType="Breakfast"
        loggedMeal={loggedMeal}
        onQuickLog={() => {}}
      />,
    );

    expect(screen.getByText("Breakfast")).toBeInTheDocument();
    expect(screen.getByText("Logged")).toBeInTheDocument();
    expect(screen.getByText("Oatmeal & Apple")).toBeInTheDocument();
  });

  it("renders WaterTracker and handles adding a glass", () => {
    const handleAddGlass = vi.fn();
    render(
      <WaterTracker glasses={3} maxGlasses={6} onAddGlass={handleAddGlass} />,
    );

    expect(screen.getByText(/Water Tracker/i)).toBeInTheDocument();
    expect(screen.getByText(/3 \/ 6/i)).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /\+ Add a Glass/i });
    fireEvent.click(button);
    expect(handleAddGlass).toHaveBeenCalled();
  });

  it("renders NutrientProgressBar with rainbow food categories", () => {
    render(
      <NutrientProgressBar
        categories={{ fruits: 2, vegetables: 3, grains: 2, protein: 1 }}
      />,
    );

    expect(screen.getByText(/Eat The Rainbow/i)).toBeInTheDocument();
    expect(screen.getByText("Fruits")).toBeInTheDocument();
    expect(screen.getByText("Vegetables")).toBeInTheDocument();
    expect(screen.getByText("Whole Grains")).toBeInTheDocument();
  });

  it("renders AvatarCustomizer studio and gear list", () => {
    render(<AvatarCustomizer currentPoints={150} />);

    expect(screen.getByText(/Leo the Super Sprout/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Wardrobe/i)).toBeInTheDocument();
  });

  it("renders TriviaQuizCard and option selection", () => {
    render(<TriviaQuizCard />);

    expect(screen.getByText(/Question 1 of/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Check Answer/i }),
    ).toBeInTheDocument();
  });

  it("renders ParentAnalyticsChart metrics and recommendations", () => {
    render(<ParentAnalyticsChart childName="Leo" />);

    expect(
      screen.getByText(/Weekly Nutrient Intake Breakdown/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Healthy Streak/i)).toBeInTheDocument();
    expect(screen.getByText(/Target Completion/i)).toBeInTheDocument();
  });
});
