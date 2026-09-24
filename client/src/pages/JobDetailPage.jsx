import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getJobById,
  getJobAuditLogs,
  updateJob,
  updateJobStatus,
  deleteJob,
} from "../services/api";
import JobDetailView from "../components/jobs/JobDetailView";
import JobModalForm from "../components/jobs/JobModalForm";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function JobDetailPage({ userRole = "admin" }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal State for Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchJobData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const jobData = await getJobById(id);
      setJob(jobData);

      try {
        const logs = await getJobAuditLogs(id);
        setAuditLogs(Array.isArray(logs) ? logs : []);
      } catch {
        setAuditLogs([]);
      }
    } catch (err) {
      console.error(`Error loading job ${id}:`, err);
      setError(
        err.response?.data?.detail || "Failed to load job details from server.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJobData();
  }, [fetchJobData]);

  const handleEditSubmit = async (payload) => {
    setIsSubmitting(true);
    setError("");
    setSuccessMsg("");
    try {
      const updated = await updateJob(id, payload);
      setJob(updated);
      setSuccessMsg("Job posting details updated successfully.");
      setIsModalOpen(false);
      fetchJobData();
    } catch (err) {
      console.error("Update job error:", err);
      setError(err.response?.data?.detail || "Failed to update job posting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (jobId, newStatus) => {
    setError("");
    setSuccessMsg("");
    try {
      await updateJobStatus(jobId, newStatus);
      setSuccessMsg(`Job status successfully transitioned to "${newStatus}".`);
      fetchJobData();
    } catch (err) {
      console.error("Status change error:", err);
      setError(err.response?.data?.detail || "Failed to update job status.");
    }
  };

  const handleDelete = async (jobId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete or archive this job posting?",
      )
    )
      return;
    try {
      await deleteJob(jobId);
      navigate("/jobs");
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.response?.data?.detail || "Failed to delete job posting.");
    }
  };

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg("")}
            className="text-emerald-600 font-bold"
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
            className="text-rose-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      <JobDetailView
        job={job}
        auditLogs={auditLogs}
        loading={loading}
        onStatusChange={handleStatusChange}
        onEdit={() => setIsModalOpen(true)}
        onDelete={handleDelete}
        userRole={userRole}
      />

      <JobModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={job}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
