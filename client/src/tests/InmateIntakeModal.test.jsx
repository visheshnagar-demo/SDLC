import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import InmateIntakeModal from "../components/inmates/InmateIntakeModal";

vi.mock("../services/api", () => ({
  createInmate: vi.fn().mockResolvedValue({ id: "uuid-1234" }),
}));

describe("InmateIntakeModal Component", () => {
  it("renders intake modal when isOpen is true", () => {
    render(<InmateIntakeModal isOpen={true} onClose={vi.fn()} />);
    expect(
      screen.getByText(/NEW INMATE INTAKE & MEDICAL RISK TAGGING/i),
    ).toBeInView();
    expect(screen.getByLabelText(/Security Tier Classification/i)).toBeInView();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <InmateIntakeModal isOpen={false} onClose={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
