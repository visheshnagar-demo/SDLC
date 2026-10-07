import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AuditLogStream from "../components/admin/AuditLogStream";

describe("AuditLogStream", () => {
  it("renders HIPAA security compliance audit log stream and filter controls", () => {
    render(<AuditLogStream />);

    expect(
      screen.getByText(/HIPAA Security & Compliance Audit Stream/i),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Search IP, User, ID.../i),
    ).toBeInTheDocument();
    expect(screen.getByText(/READ_EHR/i)).toBeInTheDocument();
  });
});
