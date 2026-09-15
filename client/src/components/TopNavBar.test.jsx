import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import TopNavBar from "./TopNavBar";

describe("TopNavBar Component", () => {
  it("renders navigation links and brand title", () => {
    render(
      <BrowserRouter>
        <TopNavBar currentUser={null} />
      </BrowserRouter>,
    );

    expect(screen.getByText("PassVault")).toBeInTheDocument();
    expect(screen.getAllByText("Pre-Register")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Host Approvals")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Reception Desk")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Audit History")[0]).toBeInTheDocument();
  });

  it("renders logged in user information when user prop is provided", () => {
    const mockUser = {
      full_name: "Alice Host",
      email: "alice@example.com",
      role: "HOST",
    };

    render(
      <BrowserRouter>
        <TopNavBar currentUser={mockUser} />
      </BrowserRouter>,
    );

    expect(screen.getByText("Alice Host")).toBeInTheDocument();
    expect(screen.getByText("HOST")).toBeInTheDocument();
  });
});
