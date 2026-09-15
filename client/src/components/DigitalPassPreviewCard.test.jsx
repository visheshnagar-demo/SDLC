import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DigitalPassPreviewCard from "./DigitalPassPreviewCard";

describe("DigitalPassPreviewCard Component", () => {
  it("renders visitor pass preview with provided form details", () => {
    const formData = {
      full_name: "Sarah Connor",
      company: "Cyberdyne Systems",
      purpose: "Security Audit",
      scheduled_start_time: "2026-10-15T09:00",
    };

    render(
      <DigitalPassPreviewCard formData={formData} hostName="Miles Dyson" />,
    );

    expect(screen.getByText("Sarah Connor")).toBeInTheDocument();
    expect(screen.getByText("Cyberdyne Systems")).toBeInTheDocument();
    expect(screen.getByText("Security Audit")).toBeInTheDocument();
    expect(screen.getByText("Miles Dyson")).toBeInTheDocument();
  });
});
