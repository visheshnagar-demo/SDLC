import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

vi.mock("./services/api", () => ({
  authService: {
    getStoredUser: () => null,
    getStoredToken: () => null,
    login: vi.fn(),
    logout: vi.fn(),
  },
  visitorService: {
    getHosts: vi
      .fn()
      .mockResolvedValue([
        { id: "h1", full_name: "Jane Smith", email: "jane@example.com" },
      ]),
    register: vi.fn(),
  },
  approvalService: {
    getPendingApprovals: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    processAction: vi.fn(),
  },
  checkinService: {
    lookup: vi.fn().mockResolvedValue([]),
    checkIn: vi.fn(),
    checkOut: vi.fn(),
  },
  historyService: {
    getHistory: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    exportCsv: vi.fn(),
  },
  default: {},
}));

describe("App Root Component", () => {
  it("renders application navigation and default landing view", () => {
    render(<App />);
    expect(screen.getAllByText(/PassVault/i)[0]).toBeInTheDocument();
    expect(
      screen.getAllByText(/Office Visitor Pass System/i)[0],
    ).toBeInTheDocument();
  });
});
