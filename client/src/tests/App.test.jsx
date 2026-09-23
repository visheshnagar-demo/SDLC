import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import App from "../App";
import HeaderNav from "../components/HeaderNav";
import TripInputForm from "../components/TripInputForm";
import BudgetHealthWidget from "../components/BudgetHealthWidget";
import DaySelectorSidebar from "../components/DaySelectorSidebar";
import TimelineActivityCard from "../components/TimelineActivityCard";
import TransitStepConnector from "../components/TransitStepConnector";
import ExportShareBar from "../components/ExportShareBar";
import SharedTripHeader from "../components/SharedTripHeader";

describe("WanderAI Application & Component Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("HeaderNav", () => {
    it("renders WanderAI logo and navigation links", () => {
      render(
        <BrowserRouter>
          <HeaderNav />
        </BrowserRouter>,
      );
      expect(screen.getByText("WanderAI")).toBeInTheDocument();
      expect(screen.getByText("Plan Trip")).toBeInTheDocument();
      expect(screen.getByText("Explore Destinations")).toBeInTheDocument();
    });
  });

  describe("TripInputForm", () => {
    it("renders default inputs for destination, budget, duration, and interest categories", () => {
      render(
        <BrowserRouter>
          <TripInputForm />
        </BrowserRouter>,
      );

      expect(screen.getByLabelText(/Destination/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Total Budget/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Duration:/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Generate Customized Itinerary/i }),
      ).toBeInTheDocument();
    });

    it("displays validation error when destination is cleared and submitted", async () => {
      render(
        <BrowserRouter>
          <TripInputForm />
        </BrowserRouter>,
      );

      const destInput = screen.getByLabelText(/Destination/i);
      fireEvent.change(destInput, { target: { value: "" } });

      const submitBtn = screen.getByRole("button", {
        name: /Generate Customized Itinerary/i,
      });
      fireEvent.click(submitBtn);

      expect(
        await screen.findByText(/Destination city or country is required/i),
      ).toBeInTheDocument();
    });

    it("displays validation error when budget is zero or negative", async () => {
      render(
        <BrowserRouter>
          <TripInputForm />
        </BrowserRouter>,
      );

      const budgetInput = screen.getByLabelText(/Total Budget/i);
      fireEvent.change(budgetInput, { target: { value: "0" } });

      const submitBtn = screen.getByRole("button", {
        name: /Generate Customized Itinerary/i,
      });
      fireEvent.click(submitBtn);

      expect(
        await screen.findByText(/Please enter a valid budget greater than 0/i),
      ).toBeInTheDocument();
    });

    it("allows clicking preset destination chips", () => {
      render(
        <BrowserRouter>
          <TripInputForm />
        </BrowserRouter>,
      );

      const parisChip = screen.getByRole("button", { name: "Paris, France" });
      fireEvent.click(parisChip);

      const destInput = screen.getByLabelText(/Destination/i);
      expect(destInput.value).toBe("Paris, France");
    });
  });

  describe("BudgetHealthWidget", () => {
    it("renders WITHIN BUDGET status when estimated cost is below budget", () => {
      render(
        <BudgetHealthWidget
          budget={2000}
          totalEstimatedCost={1750}
          currency="USD"
        />,
      );

      expect(screen.getByText(/WITHIN BUDGET/i)).toBeInTheDocument();
      const costElements = screen.getAllByText(/\$1,750/);
      expect(costElements.length).toBeGreaterThan(0);
      expect(screen.getByText("$250")).toBeInTheDocument();
    });

    it("renders OVER BUDGET alert when cost exceeds budget", () => {
      render(
        <BudgetHealthWidget
          budget={1500}
          totalEstimatedCost={1800}
          currency="USD"
        />,
      );

      expect(screen.getByText(/OVER BUDGET/i)).toBeInTheDocument();
      expect(screen.getByText("-$300")).toBeInTheDocument();
      expect(
        screen.getByText(/Budget threshold exceeded/i),
      ).toBeInTheDocument();
    });
  });

  describe("DaySelectorSidebar", () => {
    const mockDays = [
      {
        id: "d1",
        day_number: 1,
        daily_estimated_cost: 100,
        activities: [{}, {}],
      },
      { id: "d2", day_number: 2, daily_estimated_cost: 150, activities: [{}] },
    ];

    it("renders all days with activity counts and costs", () => {
      const onSelect = vi.fn();
      render(
        <DaySelectorSidebar
          days={mockDays}
          selectedDayId="d1"
          onSelectDay={onSelect}
          currency="USD"
        />,
      );

      expect(screen.getByText("Day 1")).toBeInTheDocument();
      expect(screen.getByText("Day 2")).toBeInTheDocument();
      expect(screen.getByText("$100")).toBeInTheDocument();
      expect(screen.getByText("$150")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Day 2"));
      expect(onSelect).toHaveBeenCalledWith("d2");
    });
  });

  describe("TimelineActivityCard", () => {
    const mockActivity = {
      id: "act-1",
      time_slot: "Morning",
      title: "Senso-ji Temple",
      description: "Historic Buddhist temple in Asakusa",
      category: "Culture",
      estimated_cost: 0,
      location: "Asakusa, Tokyo",
      duration_minutes: 90,
    };

    it("renders activity details correctly in view mode", () => {
      render(
        <TimelineActivityCard
          activity={mockActivity}
          index={0}
          totalInDay={1}
          currency="USD"
        />,
      );

      expect(screen.getByText("Senso-ji Temple")).toBeInTheDocument();
      expect(
        screen.getByText("Historic Buddhist temple in Asakusa"),
      ).toBeInTheDocument();
      expect(screen.getByText("Asakusa, Tokyo")).toBeInTheDocument();
      expect(screen.getByText("Free ($0)")).toBeInTheDocument();
    });

    it("triggers onDelete callback when delete button is clicked", () => {
      const onDelete = vi.fn();
      render(
        <TimelineActivityCard
          activity={mockActivity}
          index={0}
          totalInDay={1}
          currency="USD"
          onDelete={onDelete}
        />,
      );

      const deleteBtn = screen.getByTitle("Remove Activity");
      fireEvent.click(deleteBtn);
      expect(onDelete).toHaveBeenCalledWith("act-1");
    });
  });

  describe("TransitStepConnector", () => {
    it("renders transit transfer time and location", () => {
      render(
        <TransitStepConnector
          durationMinutes={20}
          transitMode="transit"
          toLocation="Shinjuku Station"
        />,
      );

      expect(screen.getByText(/~20 min transfer/i)).toBeInTheDocument();
      expect(
        screen.getByText(/heading to Shinjuku Station/i),
      ).toBeInTheDocument();
    });
  });

  describe("ExportShareBar", () => {
    const mockItinerary = {
      id: "itin-123",
      destination: "Tokyo, Japan",
      share_token: "token-456",
    };

    it("renders Export PDF, Calendar, and Share Trip action buttons", () => {
      render(<ExportShareBar itinerary={mockItinerary} />);

      expect(screen.getByText("Export PDF")).toBeInTheDocument();
      expect(screen.getByText("Export Calendar (.ics)")).toBeInTheDocument();
      expect(screen.getByText("Share Trip")).toBeInTheDocument();
    });
  });

  describe("SharedTripHeader", () => {
    const mockShared = {
      destination: "Kyoto, Japan",
      duration_days: 4,
      total_estimated_cost: 950,
      currency: "USD",
      interests: ["Culture", "Food", "History"],
    };

    it("renders shared trip title, duration, cost, and clone button", () => {
      const onClone = vi.fn();
      render(
        <BrowserRouter>
          <SharedTripHeader itinerary={mockShared} onClone={onClone} />
        </BrowserRouter>,
      );

      expect(screen.getByText("Kyoto, Japan Itinerary")).toBeInTheDocument();
      expect(screen.getByText(/4 Days/i)).toBeInTheDocument();
      expect(screen.getByText("$950")).toBeInTheDocument();
      expect(screen.getByText("#Culture")).toBeInTheDocument();

      const cloneBtn = screen.getByRole("button", {
        name: /Clone to My Planner/i,
      });
      fireEvent.click(cloneBtn);
      expect(onClone).toHaveBeenCalled();
    });
  });

  describe("App Full Router Rendering", () => {
    it("renders HomePage by default on route '/'", () => {
      render(<App />);
      expect(
        screen.getByText(/Plan Personalized Trips in Seconds/i),
      ).toBeInTheDocument();
    });
  });
});
