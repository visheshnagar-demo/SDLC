import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LinkedItemsTable from "../components/releases/LinkedItemsTable";

describe("LinkedItemsTable Component", () => {
  const mockItems = [
    {
      id: "item-1",
      issue_key: "SCRUM-101",
      summary: "Implement idempotent payment webhook processor",
      issue_type: "Feature",
      priority: "High",
      resolution_status: "Resolved",
    },
    {
      id: "item-2",
      issue_key: "BUG-202",
      summary: "Race condition in currency exchange rates cache",
      issue_type: "Bug",
      priority: "Blocker",
      resolution_status: "Open",
    },
  ];

  it("renders list of linked features and bugs", () => {
    render(<LinkedItemsTable items={mockItems} />);

    expect(screen.getByText("SCRUM-101")).toBeInTheDocument();
    expect(
      screen.getByText("Implement idempotent payment webhook processor"),
    ).toBeInTheDocument();
    expect(screen.getByText("BUG-202")).toBeInTheDocument();
    expect(
      screen.getByText("Race condition in currency exchange rates cache"),
    ).toBeInTheDocument();
  });

  it("calls onUpdateStatus when status dropdown changes", () => {
    const handleUpdate = vi.fn();
    render(
      <LinkedItemsTable items={mockItems} onUpdateStatus={handleUpdate} />,
    );

    const select = screen.getByLabelText("Update status for BUG-202");
    fireEvent.change(select, { target: { value: "Resolved" } });

    expect(handleUpdate).toHaveBeenCalledWith("item-2", "Resolved");
  });

  it("calls onDeleteItem when unlink action is triggered", () => {
    const handleDelete = vi.fn();
    render(<LinkedItemsTable items={mockItems} onDeleteItem={handleDelete} />);

    const deleteBtn = screen.getByLabelText("Unlink SCRUM-101");
    fireEvent.click(deleteBtn);

    expect(handleDelete).toHaveBeenCalledWith("item-1");
  });
});
