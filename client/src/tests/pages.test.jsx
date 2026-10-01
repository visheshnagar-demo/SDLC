import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ChildDashboard from "../pages/ChildDashboard";
import ParentDashboard from "../pages/ParentDashboard";
import MealLogger from "../pages/MealLogger";
import QuizPage from "../pages/QuizPage";
import AvatarShop from "../pages/AvatarShop";

describe("Frontend Pages Smoke and Render Tests", () => {
  it("renders Login page with test credentials helper", () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Welcome to NutriKids/i)).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Sign In to Portal/i }),
    ).toBeInTheDocument();
  });

  it("renders Register page with child profile inputs", () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Create Parent Account/i)).toBeInTheDocument();
    expect(screen.getByText(/Child Profile Details/i)).toBeInTheDocument();
  });

  it("renders ChildDashboard with meal cards and trackers", () => {
    render(
      <BrowserRouter>
        <ChildDashboard
          activeChild={{
            display_name: "Leo",
            active_streak_days: 5,
            total_points: 150,
          }}
        />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Good Afternoon, Leo!/i)).toBeInTheDocument();
    expect(screen.getByText(/Today's Meal Plate/i)).toBeInTheDocument();
  });

  it("renders MealLogger with category buttons and food presets", () => {
    render(
      <BrowserRouter>
        <MealLogger activeChild={{ display_name: "Leo" }} />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Log Your Healthy Meal/i)).toBeInTheDocument();
    expect(screen.getByText(/Quick Yummy Suggestions/i)).toBeInTheDocument();
  });

  it("renders ParentDashboard with portal title and recent logs table", () => {
    render(
      <BrowserRouter>
        <ParentDashboard activeChild={{ display_name: "Leo", age: 7 }} />
      </BrowserRouter>,
    );

    expect(
      screen.getByText(/NutriKids Parent Insight Portal/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Recent Meal Logs & Portion Verification/i),
    ).toBeInTheDocument();
  });

  it("renders QuizPage with nutrition arena banner", () => {
    render(
      <BrowserRouter>
        <QuizPage />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Nutrition Trivia Arena/i)).toBeInTheDocument();
  });

  it("renders AvatarShop with sprout shop title and points badge", () => {
    render(
      <BrowserRouter>
        <AvatarShop activeChild={{ display_name: "Leo" }} currentPoints={150} />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Rewards & Sprout Shop/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Achievement Badges/i)[0]).toBeInTheDocument();
  });
});
