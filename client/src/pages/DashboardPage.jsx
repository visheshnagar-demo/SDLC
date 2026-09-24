import React, { useState, useEffect } from "react";
import MetricCards from "../components/releases/MetricCards";
import ReleasesTable from "../components/releases/ReleasesTable";
import CreateReleaseModal from "../components/releases/CreateReleaseModal";
import {
  getReleases,
  createRelease,
  updateRelease,
  deleteRelease,
} from "../services/api";
import { PlusCircle, RefreshCw, AlertCircle } from "lucide-react";

export const DashboardPage = () => {
  const [releases, setReleases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReleases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getReleases();
      setReleases(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load software releases from server.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  // Compute summary metrics
  const totalReleases = releases.length;
  const activeReleases = releases.filter(
    (r) =>
      r.status?.toUpperCase() === "IN PROGRESS" ||
      r.status?.toUpperCase() === "OPEN" ||
      r.status?.toUpperCase() === "DRAFT",
  ).length;

  const avgReadiness =
    totalReleases > 0
      ? releases.reduce(
          (acc, r) => acc + (Number(r.readiness_percentage) || 0),
          0,
        ) / totalReleases
      : 0;

  const unresolvedBlockers = releases.reduce(
    (acc, r) =>
      acc + (Number(r.unresolved_blockers) || Number(r.blocker_count) || 0),
    0,
  );

  const handleOpenCreateModal = () => {
    setEditingRelease(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (release) => {
    setEditingRelease(release);
    setIsModalOpen(true);
  };

  const handleSaveRelease = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingRelease) {
        await updateRelease(editingRelease.id, formData);
      } else {
        await createRelease(formData);
      }
      await fetchReleases();
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRelease = async (releaseId) => {
    if (
      !window.confirm("Are you sure you want to delete this software release?")
    ) {
      return;
    }
    try {
      await deleteRelease(releaseId);
      await fetchReleases();
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          err.message ||
          "Failed to delete release.",
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#dae2fd]">
            Software Releases Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track milestones, deliverables, readiness gates, and deployment
            pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReleases}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Release</span>
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchReleases}
            className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded text-xs font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <MetricCards
        totalReleases={totalReleases}
        activeReleases={activeReleases}
        avgReadiness={avgReadiness}
        unresolvedBlockers={unresolvedBlockers}
      />

      {/* Releases Data Table */}
      <ReleasesTable
        releases={releases}
        isLoading={isLoading}
        onEditRelease={handleOpenEditModal}
        onDeleteRelease={handleDeleteRelease}
      />

      {/* Create / Edit Release Modal */}
      <CreateReleaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveRelease}
        initialData={editingRelease}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default DashboardPage;
