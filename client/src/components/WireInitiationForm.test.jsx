import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import WireInitiationForm from "./WireInitiationForm";

describe("WireInitiationForm", () => {
  it("renders form inputs and submit button", () => {
    render(
      <WireInitiationForm
        activeUser="User A"
        onWireSubmitted={vi.fn()}
        onError={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/Beneficiary Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Account Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Routing Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount \(\$ USD\)/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Submit Wire Transfer/i }),
    ).toBeInTheDocument();
  });

  it("validates empty inputs on submit", async () => {
    const onErrorMock = vi.fn();
    render(
      <WireInitiationForm
        activeUser="User A"
        onWireSubmitted={vi.fn()}
        onError={onErrorMock}
      />,
    );

    const submitBtn = screen.getByRole("button", {
      name: /Submit Wire Transfer/i,
    });
    fireEvent.click(submitBtn);

    expect(onErrorMock).toHaveBeenCalledWith(
      "Please fill in all required fields.",
    );
  });
});
