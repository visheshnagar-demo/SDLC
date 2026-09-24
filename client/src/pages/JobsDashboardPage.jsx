import React, { useState, useEffect, useCallback } from "react";
import {
  getJobs,
  createJob,
  updateJob,
  deleteJob,
  updateJobStatus,
} from "../services/api";
import FilterBar from "../components/jobs/FilterBar";
import JobTable from "../components/jobs/JobTable";
import JobModalForm from "../components/jobs/JobModalForm";
import {
  Plus,
  Briefcase,
  CheckCircle2,
  FileText,
  XCircle,
  AlertCircle,
} from "lucide-react";

export default function JobsDashboardPage({ userRole = "admin" }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filtering & Pagination State
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [totalJobs, setTotalJobs] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Jobs Function
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const skip = (page - 1) * limit;
      const params = {
        skip,
        limit,
      };

      if (search) params.search = search;
      if (department) params.department = department;
      if (locationFilter) params.location = locationFilter;
      if (employmentType) params.employment_type = employmentType;

      // If user is guest/public, enforce status = published
      if (userRole === "guest") {
        params.status = "published";
      } else if (status) {
        params.status = status;
      }

      const data = await getJobs(params);
      if (Array.isArray(data)) {
        setJobs(data);
        setTotalJobs(data.length);
      } else if (data && data.items) {
        setJobs(data.items);
        setTotalJobs(data.total || data.items.length);
      } else {
        setJobs([]);
        setTotalJobs(0);
      }
    } catch (err) {
      console.error("Failed to load jobs:", err);
      setError(
        err.response?.data?.detail || "Failed to load jobs from server.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    search,
    department,
    locationFilter,
    employmentType,
    status,
    page,
    limit,
    userRole,
  ]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleResetFilters = () => {
    setSearch("");
    setDepartment("");
    setLocationFilter("");
    setEmploymentType("");
    setStatus("");
    setPage(1);
  };

  // KPI Metrics Calculation
  const totalCount = jobs.length;
  const publishedCount = jobs.filter(
    (j) => (j.status || "").toLowerCase() === "published",
  ).length;
  const draftCount = jobs.filter(
    (j) => (j.status || "").toLowerCase() === "draft",
  ).length;
  const closedCount = jobs.filter((j) =>
    ["closed", "archived"].includes((j.status || "").toLowerCase()),
  ).length;

  // Modal Handlers
  const handleOpenCreateModal = () => {
    setEditingJob(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (job) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingJob(null);
  };

  const handleFormSubmit = async (payload) => {
    setIsSubmitting(true);
    setError("");
    setSuccessMsg("");
    try {
      if (editingJob) {
        await updateJob(editingJob.id, payload);
        setSuccessMsg(`Successfully updated job posting "${payload.title}".`);
      } else {
        await createJob(payload);
        setSuccessMsg(`Successfully created job posting "${payload.title}".`);
      }
      handleCloseModal();
      fetchJobs();
    } catch (err) {
      console.error("Job submit error:", err);
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Operation failed. Please check inputs.";
      setError(typeof msg === "object" ? JSON.stringify(msg) : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete or archive this job posting?",
      )
    )
      return;
    setError("");
    setSuccessMsg("");
    try {
      await deleteJob(jobId);
      setSuccessMsg("Job posting deleted successfully.");
      fetchJobs();
    } catch (err) {
      console.error("Delete job error:", err);
      setError(err.response?.data?.detail || "Failed to delete job posting.");
    }
  };

  const handleStatusChange = async (jobId, newStatus) => {
    setError("");
    setSuccessMsg("");
    try {
      await updateJobStatus(jobId, newStatus);
      setSuccessMsg(`Job status updated to "${newStatus}".`);
      fetchJobs();
    } catch (err) {
      console.error("Status change error:", err);
      setError(err.response?.data?.detail || "Failed to update job status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg("")}
            className="text-emerald-600 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError("")}
            className="text-rose-600 hover:text-rose-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Page Heading & Action Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Job Postings Management
          </h1>
          <p className="text-sm text-slate-500">
            Create, filter, track, and manage job listings and applicant
            workflows
          </p>
        </div>

        {userRole !== "guest" && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm shadow-sm flex items-center space-x-2 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Job</span>
          </button>
        )}
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">
              Total Listed
            </div>
            <div className="text-xl font-bold text-slate-900">{totalCount}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">
              Published
            </div>
            <div className="text-xl font-bold text-slate-900">
              {publishedCount}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">
              Drafts
            </div>
            <div className="text-xl font-bold text-slate-900">{draftCount}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">
              Closed / Archived
            </div>
            <div className="text-xl font-bold text-slate-900">
              {closedCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        search={search}
        setSearch={setSearch}
        department={department}
        setDepartment={setDepartment}
        locationFilter={locationFilter}
        setLocationFilter={setLocationFilter}
        employmentType={employmentType}
        setEmploymentType={setEmploymentType}
        status={status}
        setStatus={setStatus}
        onReset={handleResetFilters}
        userRole={userRole}
      />

      {/* Main Jobs Data Table */}
      <JobTable
        jobs={jobs}
        loading={loading}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteJob}
        onStatusChange={handleStatusChange}
        userRole={userRole}
        page={page}
        limit={limit}
        totalJobs={totalJobs}
        setPage={setPage}
      />

      {/* Modal Form */}
      <JobModalForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        initialData={editingJob}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
