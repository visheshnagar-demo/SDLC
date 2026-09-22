import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ProvisionWizard from "../components/instances/ProvisionWizard.jsx";
import InstanceActionToolbar from "../components/instances/InstanceActionToolbar.jsx";
import Login from "../pages/Login.jsx";

describe("Components Deep Dive Tests", () => {
  it("renders ProvisionWizard multi-step form and navigates steps", () => {
    const handleSubmit = vi.fn();
    render(
      <ProvisionWizard
        currentUser={{ role: "ADMIN" }}
        onSubmit={handleSubmit}
      />,
    );

    expect(screen.getByText(/1. Select Cloud Provider/i)).toBeInTheDocument();
    expect(screen.getByText(/Amazon Web Services/i)).toBeInTheDocument();

    // Click Next Step
    const nextBtn = screen.getByText(/Next Step/i);
    fireEvent.click(nextBtn);

    expect(
      screen.getByText(/Choose Machine Type & Compute Specs/i),
    ).toBeInTheDocument();
  });

  it("renders InstanceActionToolbar with admin lifecycle action controls", () => {
    const handleAction = vi.fn();
    const mockInstance = {
      id: "inst-123",
      name: "worker-01",
      status: "RUNNING",
    };

    render(
      <InstanceActionToolbar
        instance={mockInstance}
        currentUser={{ role: "ADMIN" }}
        onAction={handleAction}
      />,
    );

    expect(screen.getByText("RUNNING")).toBeInTheDocument();
    const stopButton = screen.getByText("Stop");
    expect(stopButton).toBeInTheDocument();
    fireEvent.click(stopButton);
    expect(handleAction).toHaveBeenCalledWith("STOP");
  });

  it("renders InstanceActionToolbar in read-only mode for non-admin", () => {
    const mockInstance = {
      id: "inst-123",
      name: "worker-01",
      status: "RUNNING",
    };

    render(
      <InstanceActionToolbar
        instance={mockInstance}
        currentUser={{ role: "READ_ONLY" }}
      />,
    );

    expect(
      screen.getByText(/Read-Only mode: Lifecycle operations locked/i),
    ).toBeInTheDocument();
  });

  it("renders Login page with seeded test account credentials", () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>,
    );

    expect(screen.getByText(/Sign In to CloudPulse/i)).toBeInTheDocument();
    expect(
      screen.getByText(/admin@example.com \/ adminpassword/i),
    ).toBeInTheDocument();
  });
});
