import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ApiRegistrationModal from "./ApiRegistrationModal";

describe("ApiRegistrationModal Component", () => {
  it("does not render when isOpen is false", () => {
    render(
      <ApiRegistrationModal
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(
      screen.queryByText(/register new api endpoint/i),
    ).not.toBeInTheDocument();
  });

  it("renders modal with form inputs when isOpen is true", () => {
    render(
      <ApiRegistrationModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText(/register new api endpoint/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/auth service health/i),
    ).toBeInTheDocument();
  });

  it("validates URL format and prevents submit with invalid URL", async () => {
    const handleSubmit = vi.fn();
    render(
      <ApiRegistrationModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />,
    );

    const nameInput = screen.getByPlaceholderText(/auth service health/i);
    const urlInput = screen.getByPlaceholderText(
      /https:\/\/api.example.com\/health/i,
    );
    const submitBtn = screen.getByRole("button", {
      name: /register endpoint/i,
    });

    fireEvent.change(nameInput, { target: { value: "Test Service" } });
    fireEvent.change(urlInput, { target: { value: "ftp://invalid-url" } });
    fireEvent.click(submitBtn);

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /must start with http:\/\/ or https:\/\//i,
    );
  });

  it("submits valid API data successfully", async () => {
    const handleSubmit = vi.fn().mockResolvedValue({});
    render(
      <ApiRegistrationModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />,
    );

    const nameInput = screen.getByPlaceholderText(/auth service health/i);
    const urlInput = screen.getByPlaceholderText(
      /https:\/\/api.example.com\/health/i,
    );
    const submitBtn = screen.getByRole("button", {
      name: /register endpoint/i,
    });

    fireEvent.change(nameInput, { target: { value: "Valid Service" } });
    fireEvent.change(urlInput, {
      target: { value: "https://api.valid.com/health" },
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Valid Service",
          target_url: "https://api.valid.com/health",
          http_method: "GET",
          expected_status: 200,
        }),
      );
    });
  });
});
