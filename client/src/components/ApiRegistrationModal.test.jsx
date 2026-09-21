import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ApiRegistrationModal from "./ApiRegistrationModal";

describe("ApiRegistrationModal", () => {
  it("renders modal with required form inputs when open", () => {
    render(
      <ApiRegistrationModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    expect(screen.getByText("Register New API Endpoint")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Auth Service Health/i),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/https:\/\/api.internal/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Register Endpoint/i }),
    ).toBeInTheDocument();
  });

  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <ApiRegistrationModal
        isOpen={false}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
