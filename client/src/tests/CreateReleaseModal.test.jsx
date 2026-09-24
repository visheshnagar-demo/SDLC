import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CreateReleaseModal from "../components/releases/CreateReleaseModal";

describe("CreateReleaseModal Component", () => {
  it("renders form inputs when modal is open", () => {
    render(
      <CreateReleaseModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );

    expect(screen.getByText("Create Software Release")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/e.g. core banking/i),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. v1.2.0/i)).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <CreateReleaseModal
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("submits the form with provided release data", async () => {
    const handleSubmit = vi.fn().mockResolvedValue({});
    render(
      <CreateReleaseModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />,
    );

    const nameInput = screen.getByPlaceholderText(/e.g. core banking/i);
    const semverInput = screen.getByPlaceholderText(/e.g. v1.2.0/i);

    fireEvent.change(nameInput, { target: { value: "Release 2.0.0" } });
    fireEvent.change(semverInput, { target: { value: "v2.0.0" } });

    const submitBtn = screen.getByRole("button", { name: "Create Release" });
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalled();
  });
});
