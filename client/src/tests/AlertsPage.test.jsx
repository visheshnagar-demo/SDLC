import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import AlertsPage from "../pages/AlertsPage";

describe("AlertsPage", () => {
  it("renders AlertsPage title", async () => {
    render(
      <BrowserRouter>
        <AlertsPage />
      </BrowserRouter>,
    );
    expect(
      await screen.findByText(
        /Maintenance Tickets & Real-Time Failure Alerts/i,
      ),
    ).toBeInTheDocument();
  });
});
