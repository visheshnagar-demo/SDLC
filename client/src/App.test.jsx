import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "./App";
import * as api from "./services/api";

vi.mock("./services/api");

describe("App Component", () => {
  it("renders application dashboard shell without crashing", () => {
    vi.mocked(api.getDashboardSummary).mockResolvedValue({
      total_apis: 0,
      active_failures: 0,
      overall_uptime_pct: 100,
      average_latency_ms: 0,
    });
    vi.mocked(api.listApis).mockResolvedValue([]);

    render(<App />);
    expect(screen.getByText(/api pulse/i)).toBeInTheDocument();
  });
});
