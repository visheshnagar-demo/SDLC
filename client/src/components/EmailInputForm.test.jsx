import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EmailInputForm } from "./EmailInputForm";

describe("EmailInputForm Component", () => {
  it("renders input mode buttons and submit button", () => {
    render(<EmailInputForm onClassificationSuccess={vi.fn()} />);

    expect(screen.getByText("Text Entry")).toBeInTheDocument();
    expect(
      screen.getByText("File Upload (.eml, .txt, .pdf)"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Classify Email/i }),
    ).toBeInTheDocument();
  });

  it("allows filling subject and email body and switches mode", () => {
    render(<EmailInputForm onClassificationSuccess={vi.fn()} />);

    const subjectInput = screen.getByPlaceholderText(
      /e\.g\. Urgent: Server Alert/i,
    );
    fireEvent.change(subjectInput, { target: { value: "Test Subject Line" } });
    expect(subjectInput.value).toBe("Test Subject Line");

    const bodyTextarea = screen.getByPlaceholderText(
      /Paste the raw email body/i,
    );
    fireEvent.change(bodyTextarea, {
      target: { value: "Test email body content" },
    });
    expect(bodyTextarea.value).toBe("Test email body content");

    // Switch to file mode
    const fileModeBtn = screen.getByText("File Upload (.eml, .txt, .pdf)");
    fireEvent.click(fileModeBtn);

    expect(
      screen.getByText(/Choose an email file or drag & drop/i),
    ).toBeInTheDocument();
  });

  it("applies quick test templates on click", () => {
    render(<EmailInputForm onClassificationSuccess={vi.fn()} />);

    const templateBtn = screen.getByText("🚨 Urgent Outage");
    fireEvent.click(templateBtn);

    const subjectInput = screen.getByPlaceholderText(
      /e\.g\. Urgent: Server Alert/i,
    );
    expect(subjectInput.value).toContain(
      "CRITICAL: Database Cluster Unresponsive",
    );
  });

  it("shows validation error when submitting empty text", async () => {
    render(<EmailInputForm onClassificationSuccess={vi.fn()} />);

    const submitBtn = screen.getByRole("button", { name: /Classify Email/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(
        /Email body text is required for classification/i,
      ),
    ).toBeInTheDocument();
  });
});
