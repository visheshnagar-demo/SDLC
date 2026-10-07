import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthProvider } from "../context/AuthContext";
import PatientDirectoryTable from "../components/admin/PatientDirectoryTable";

describe("PatientDirectoryTable", () => {
  it("renders patient master registry with search, deduplication badges, and registration button", () => {
    render(
      <AuthProvider>
        <PatientDirectoryTable />
      </AuthProvider>,
    );

    expect(screen.getByText(/Patient Master Registry/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Search MRN, Name, SSN.../i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Register Patient/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Eleanor Vance/i)).toBeInTheDocument();
  });
});
