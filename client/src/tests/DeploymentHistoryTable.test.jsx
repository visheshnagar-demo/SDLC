import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import DeploymentHistoryTable from "../components/releases/DeploymentHistoryTable";

describe("DeploymentHistoryTable Component", () => {
  const mockDeployments = [
    {
      id: "dep-1",
      environment: "Staging",
      status: "Success",
      deployed_by: "devops-engineer@company.com",
      created_at: "2026-06-15T10:00:00Z",
      execution_logs: "Deployment completed with zero errors.",
    },
  ];

  it("renders deployment environment and status", () => {
    render(<DeploymentHistoryTable deployments={mockDeployments} />);

    expect(screen.getByText("Staging")).toBeInTheDocument();
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("devops-engineer@company.com")).toBeInTheDocument();
  });

  it("opens execution logs modal when 'View Logs' is clicked", () => {
    render(<DeploymentHistoryTable deployments={mockDeployments} />);

    const logsBtn = screen.getByRole("button", { name: /view logs/i });
    fireEvent.click(logsBtn);

    expect(
      screen.getByText("Deployment completed with zero errors."),
    ).toBeInTheDocument();
  });
});
