import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TaskItem from "./TaskItem";

describe("TaskItem component", () => {
  const mockTask = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    title: "Buy groceries",
    description: "Milk, eggs, bread",
    is_completed: false,
    created_at: "2026-09-18T10:50:00Z",
    updated_at: "2026-09-18T10:50:00Z",
  };

  it("renders active task correctly with title and description", () => {
    const handleToggle = vi.fn();
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(
      <TaskItem
        task={mockTask}
        onToggle={handleToggle}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />,
    );

    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
    expect(screen.getByText("Milk, eggs, bread")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("triggers onToggle when checkbox is clicked", () => {
    const handleToggle = vi.fn();
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(
      <TaskItem
        task={mockTask}
        onToggle={handleToggle}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />,
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(handleToggle).toHaveBeenCalledTimes(1);
    expect(handleToggle).toHaveBeenCalledWith(mockTask);
  });

  it("triggers onEdit when edit button is clicked", () => {
    const handleToggle = vi.fn();
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(
      <TaskItem
        task={mockTask}
        onToggle={handleToggle}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />,
    );

    const editBtn = screen.getByLabelText(/edit task/i);
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledTimes(1);
    expect(handleEdit).toHaveBeenCalledWith(mockTask);
  });

  it("triggers onDelete when delete button is clicked", () => {
    const handleToggle = vi.fn();
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(
      <TaskItem
        task={mockTask}
        onToggle={handleToggle}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />,
    );

    const deleteBtn = screen.getByLabelText(/delete task/i);
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledTimes(1);
    expect(handleDelete).toHaveBeenCalledWith(mockTask.id);
  });

  it("renders completed task with completed badge and checked checkbox", () => {
    const completedTask = { ...mockTask, is_completed: true };
    const handleToggle = vi.fn();
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(
      <TaskItem
        task={completedTask}
        onToggle={handleToggle}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />,
    );

    expect(screen.getByText("Completed")).toBeInTheDocument();
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });
});
