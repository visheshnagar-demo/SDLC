import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import RegisterApiModal from "../components/RegisterApiModal";

describe("RegisterApiModal Component", () => {
  it("does not render when isOpen is false", () => {
    const { container } = render(
      <RegisterApiModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal form inputs when isOpen is true", () => {
    render(
      <RegisterApiModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );
    expect(
      screen.getByText("Register Target API for Monitoring"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("e.g. User Authentication Service"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("https://api.example.com/v1/health"),
    ).toBeInTheDocument();
  });

  it("validates required fields on submit", async () => {
    const handleSubmit = vi.fn();
    render(
      <RegisterApiModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />,
    );

    const submitBtn = screen.getByRole("button", { name: /Register API/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Monitor name is required")).toBeInTheDocument();
      expect(screen.getByText("Endpoint URL is required")).toBeInTheDocument();
    });
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("submits form with valid data", async () => {
    const handleSubmit = vi.fn().mockResolvedValue({});
    const handleClose = vi.fn();

    render(
      <RegisterApiModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />,
    );

    fireEvent.change(
      screen.getByPlaceholderText("e.g. User Authentication Service"),
      { target: { value: "Payment API" } },
    );
    fireEvent.change(
      screen.getByPlaceholderText("https://api.example.com/v1/health"),
      { target: { value: "https://api.example.com/v1/pay/health" } },
    );

    const submitBtn = screen.getByRole("button", { name: /Register API/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Payment API",
          url: "https://api.example.com/v1/pay/health",
          http_method: "GET",
        }),
      );
    });
  });
});
