import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import ConsultationsPage from "../pages/ConsultationsPage";

describe("ConsultationsPage Component", () => {
  it("renders clinical consultation workspace header and encounter section", async () => {
    render(
      <BrowserRouter>
        <ConsultationsPage />
      </BrowserRouter>,
    );

    expect(
      screen.getByText(/Clinical Consultation Workspace & EMR/i),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Patient Clinical Vitals/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Clinical Examination & ICD-10 Diagnosis/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/e-Prescribe & Medication Orders/i),
      ).toBeInTheDocument();
    });
  });
});
