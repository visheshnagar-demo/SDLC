import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import VisitorScreeningPanel from "../components/visitors/VisitorScreeningPanel";

vi.mock("../services/api", () => ({
  getVisitorLogs: vi
    .fn()
    .mockResolvedValue([
      {
        id: "v1",
        visitor_name: "Sarah Connor",
        visitor_id_number: "DL-1234",
        inmate_id: "inm-1",
        check_in_time: new Date().toISOString(),
      },
    ]),
  getInmates: vi.fn().mockResolvedValue([]),
  checkInVisitor: vi.fn().mockResolvedValue({ message: "Access granted" }),
  checkOutVisitor: vi.fn().mockResolvedValue({ message: "Checked out" }),
}));

describe("VisitorScreeningPanel Component", () => {
  it("renders visitor screening header and form fields", async () => {
    render(<VisitorScreeningPanel />);
    expect(
      await screen.findByText(/VISITOR SCREENING & ACCESS CONTROL TERMINAL/i),
    ).toBeInView();
    expect(screen.getByText(/VISITOR CHECK-IN DESK/i)).toBeInView();
  });

  it("renders active visitor logs", async () => {
    render(<VisitorScreeningPanel />);
    expect(await screen.findByText("Sarah Connor")).toBeInView();
  });
});
