import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import JobTable from "../components/jobs/JobTable";
import FilterBar from "../components/jobs/FilterBar";
import JobModalForm from "../components/jobs/JobModalForm";
import JobDetailView from "../components/jobs/JobDetailView";

const mockJob = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  title: "Senior Backend Developer",
  department: "Engineering",
  location: "Remote",
  employment_type: "Full-time",
  salary_min: 120000,
  salary_max: 150000,
  currency: "USD",
  status: "published",
  description: "We are looking for a Senior Backend Developer.",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("Job Management UI Components", () => {
  it("renders JobTable with job data correctly", () => {
    render(
      <BrowserRouter>
        <JobTable
          jobs={[mockJob]}
          loading={false}
          onEdit={() => {}}
          onDelete={() => {}}
          onStatusChange={() => {}}
          userRole="admin"
          page={1}
          limit={20}
          totalJobs={1}
          setPage={() => {}}
        />
      </BrowserRouter>,
    );

    expect(screen.getByText("Senior Backend Developer")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("Remote")).toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
  });

  it("renders FilterBar controls and reacts to search changes", () => {
    const setSearch = vi.fn();
    render(
      <FilterBar
        search=""
        setSearch={setSearch}
        department=""
        setDepartment={() => {}}
        locationFilter=""
        setLocationFilter={() => {}}
        employmentType=""
        setEmploymentType={() => {}}
        status=""
        setStatus={() => {}}
        onReset={() => {}}
        userRole="admin"
      />,
    );

    const searchInput = screen.getByPlaceholderText(/Search jobs by title/i);
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "Backend" } });
    expect(setSearch).toHaveBeenCalledWith("Backend");
  });

  it("validates JobModalForm fields on submit", async () => {
    const handleSubmit = vi.fn();
    render(
      <JobModalForm
        isOpen={true}
        onClose={() => {}}
        onSubmit={handleSubmit}
        initialData={null}
        isSubmitting={false}
      />,
    );

    expect(screen.getByText("Create New Job Posting")).toBeInTheDocument();

    // Fill title
    const titleInput = screen.getByPlaceholderText(
      /e.g. Senior Backend Developer/i,
    );
    fireEvent.change(titleInput, { target: { value: "Frontend Engineer" } });

    // Submit form
    const submitBtn = screen.getByRole("button", { name: /Create Posting/i });
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Frontend Engineer",
        department: "Engineering",
        location: "Remote",
      }),
    );
  });

  it("renders JobDetailView with status transitions", () => {
    const handleStatusChange = vi.fn();
    render(
      <BrowserRouter>
        <JobDetailView
          job={mockJob}
          auditLogs={[]}
          onStatusChange={handleStatusChange}
          onEdit={() => {}}
          onDelete={() => {}}
          userRole="admin"
          loading={false}
        />
      </BrowserRouter>,
    );

    expect(screen.getByText("Senior Backend Developer")).toBeInTheDocument();
    expect(screen.getByText("Close Job Posting")).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: /Close Job Posting/i });
    fireEvent.click(closeBtn);

    expect(handleStatusChange).toHaveBeenCalledWith(mockJob.id, "closed");
  });
});
