import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BrowserRouter } from "react-router-dom";
import UploadPage from "../pages/UploadPage";

describe("UploadPage Component", () => {
  it("renders upload page title and navigation", () => {
    render(
      <BrowserRouter>
        <UploadPage />
      </BrowserRouter>,
    );

    expect(
      screen.getByText("Email Ingestion & Batch Ingest"),
    ).toBeInTheDocument();
    expect(screen.getByText("Back to Dashboard")).toBeInTheDocument();
  });
});
