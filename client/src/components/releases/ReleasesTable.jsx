import React, { useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../common/Badge";
import {
  Search,
  Calendar,
  Layers,
  ArrowRight,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

export const ReleasesTable = ({
  releases = [],
  onEditRelease,
  onDeleteRelease,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const filteredReleases = releases.filter((rel) => {
    const matchesSearch =
      rel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rel.semver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rel.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "ALL" ||
      rel.status?.toUpperCase() === selectedStatus.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  const statuses = [
    "ALL",
    "DRAFT",
    "IN PROGRESS",
    "READY",
    "DEPLOYED",
    "CANCELLED",
  ];

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-sm overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search releases by name or SemVer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0b0f19] border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-9 pr-3.5 py-1.5 text-xs text-[#dae2fd] placeholder-slate-500 transition-colors"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-1 w-full sm:w-auto">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedStatus === st
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/80"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading releases...</span>
        </div>
      ) : filteredReleases.length === 0 ? (
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Layers className="w-10 h-10 text-slate-600" />
          <p className="text-sm font-medium text-slate-300">
            No releases found
          </p>
          <p className="text-xs text-slate-500">
            {searchTerm || selectedStatus !== "ALL"
              ? "Try adjusting your search criteria or status filter."
              : "Create your first software release milestone to get started."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#131b2e]/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Release & Version</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Target Date</th>
                <th className="py-3 px-4">Environments</th>
                <th className="py-3 px-4">Readiness</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredReleases.map((rel) => {
                const targetEnvs = Array.isArray(rel.target_environments)
                  ? rel.target_environments
                  : typeof rel.target_environments === "string"
                    ? rel.target_environments.split(",")
                    : [];

                const readinessScore = rel.readiness_percentage ?? 0;
                const hasBlockers =
                  (rel.unresolved_blockers || rel.blocker_count || 0) > 0;

                return (
                  <tr
                    key={rel.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* Name & SemVer */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-start gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/releases/${rel.id}`}
                              className="font-semibold text-sm text-[#dae2fd] hover:text-indigo-400 transition-colors"
                            >
                              {rel.name}
                            </Link>
                            <span className="px-2 py-0.5 bg-indigo-500/20 text-[#c0c1ff] font-mono text-[11px] font-semibold rounded border border-indigo-500/30">
                              {rel.semver}
                            </span>
                          </div>
                          {rel.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 max-w-md">
                              {rel.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <Badge>{rel.status || "Draft"}</Badge>
                    </td>

                    {/* Target Date */}
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {rel.target_date
                            ? new Date(rel.target_date).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )
                            : "Not scheduled"}
                        </span>
                      </div>
                    </td>

                    {/* Environments */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {targetEnvs.length > 0 ? (
                          targetEnvs.map((env) => (
                            <span
                              key={env}
                              className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono border border-slate-700"
                            >
                              {env.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-[11px]">
                            None defined
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Readiness */}
                    <td className="py-3.5 px-4">
                      <div className="w-36 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-medium">
                            {readinessScore}%
                          </span>
                          {hasBlockers && (
                            <span className="flex items-center gap-1 text-rose-400 text-[10px] font-semibold">
                              <AlertTriangle className="w-3 h-3" />
                              Blocker
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              hasBlockers
                                ? "bg-rose-500"
                                : readinessScore >= 100
                                  ? "bg-emerald-500"
                                  : readinessScore > 50
                                    ? "bg-indigo-500"
                                    : "bg-amber-500"
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(0, readinessScore))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onEditRelease && (
                          <button
                            onClick={() => onEditRelease(rel)}
                            aria-label={`Edit ${rel.name}`}
                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteRelease && (
                          <button
                            onClick={() => onDeleteRelease(rel.id)}
                            aria-label={`Delete ${rel.name}`}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <Link
                          to={`/releases/${rel.id}`}
                          className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-lg text-xs font-medium border border-indigo-500/30 transition-colors ml-1"
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReleasesTable;
