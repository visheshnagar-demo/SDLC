import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import VisitorRegistrationForm from "./VisitorRegistrationForm";

vi.mock("../services/api", () => ({
  visitorService: {
    getHosts: vi.fn().mockResolvedValue([
      {
        id: "h-1",
        full_name: "John Doe",
        email: "john@example.com",
        department: "Engineering",
      },
    ]),
    register: vi.fn(),
  },
}));

describe("VisitorRegistrationForm Component", () => {
  it("renders form inputs for name, email, phone, and purpose", async () => {
    render(<VisitorRegistrationForm />);

    expect(
      screen.getByPlaceholderText(/e\.g\. Alex Johnson/i),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/alex\.johnson@example\.com/i),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/\+1 \(555\) 019-2834/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Submit Pre-Registration/i }),
    ).toBeInTheDocument();
  });
});
