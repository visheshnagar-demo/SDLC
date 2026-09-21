import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import AnalyticsPage from "../pages/AnalyticsPage";

describe("AnalyticsPage", () => {
  it("renders Yield Analytics title", async () => {
    render(
      <BrowserRouter>
        <AnalyticsPage />
      </BrowserRouter>,
    );
    expect(
      await screen.findByText(/Rainfall Telemetry & Harvest Yield Analytics/i),
    ).toBeInTheDocument();
  });
});
