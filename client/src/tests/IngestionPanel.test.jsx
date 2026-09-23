import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import IngestionPanel from "../components/IngestionPanel";
import emailService from "../services/api";

vi.mock("../services/api", () => ({
  default: {
    ingestRawText: vi.fn(),
    uploadEmailFile: vi.fn(),
  },
}));

describe("IngestionPanel Component", () => {
  it("renders dual panels for batch file upload and raw text ingestion", () => {
    render(<IngestionPanel />);

    expect(screen.getByText("Batch File Upload")).toBeInTheDocument();
    expect(screen.getByText("Direct Raw Text Ingestion")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Paste raw email header and body text here/i),
    ).toBeInTheDocument();
  });

  it("submits raw text payload to emailService.ingestRawText", async () => {
    const onIngestedMock = vi.fn();
    const mockCreatedEmail = {
      id: "email-uuid-999",
      subject: "Critical Alert",
      body: "Server load is 99%",
      category: "Urgent",
      confidence_score: 0.96,
    };

    emailService.ingestRawText.mockResolvedValueOnce(mockCreatedEmail);

    render(<IngestionPanel onEmailIngested={onIngestedMock} />);

    fireEvent.change(
      screen.getByPlaceholderText(/Project Delivery Schedule Update/i),
      {
        target: { value: "Critical Alert" },
      },
    );

    fireEvent.change(
      screen.getByPlaceholderText(/Paste raw email header and body text here/i),
      {
        target: { value: "Server load is 99%" },
      },
    );

    fireEvent.click(screen.getByRole("button", { name: /Classify Raw Text/i }));

    await waitFor(() => {
      expect(emailService.ingestRawText).toHaveBeenCalledWith({
        subject: "Critical Alert",
        body: "Server load is 99%",
      });
      expect(onIngestedMock).toHaveBeenCalledWith(mockCreatedEmail);
    });
  });
});
