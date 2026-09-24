import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Building,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  UserCheck,
  CheckCircle2,
  XCircle,
  Archive,
  Edit3,
  Trash2,
  History,
  Users,
  ShieldAlert,
} from "lucide-react";

export default function JobDetailView({
  job,
  auditLogs = [],
  onStatusChange,
  onEdit,
  onDelete,
  userRole = "admin",
  loading = false,
}) {
  const [transitioning, setTransitioning] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
        <p className="text-slate-500 font-medium">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 mb-1">Job Not Found</h3>
        <p className="text-slate-500 text-sm mb-4">
          The job posting you are looking for does not exist or has been
          removed.
        </p>
        <Link
          to="/jobs"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Back to Jobs Dashboard
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const st = (status || "draft").toLowerCase();
    switch (st) {
      case "published":
        return (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
            Published
          </span>
        );
      case "draft":
        return (
          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-200">
            Draft
          </span>
        );
      case "closed":
        return (
          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full border border-slate-200">
            Closed
          </span>
        );
      case "archived":
        return (
          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full border border-purple-200">
            Archived
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full capitalize">
            {status}
          </span>
        );
    }
  };

  const formatSalary = (min, max, currency = "USD") => {
    if (!min && !max) return "Competitive / Undisclosed";
    const curr = currency || "USD";
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr,
      maximumFractionDigits: 0,
    });
    if (min && max)
      return `${formatter.format(min)} - ${formatter.format(max)} / year`;
    if (min) return `From ${formatter.format(min)} / year`;
    return `Up to ${formatter.format(max)} / year`;
  };

  const handleStatusTransition = async (nextStatus) => {
    setTransitioning(true);
    try {
      await onStatusChange(job.id, nextStatus);
    } finally {
      setTransitioning(false);
    }
  };

  const currentStatus = (job.status || "draft").toLowerCase();

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/jobs"
          className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Jobs</span>
        </Link>
        <div className="text-xs text-slate-400">
          Jobs &gt;{" "}
          <span className="text-slate-600">{job.department || "General"}</span>{" "}
          &gt; <span className="text-slate-800 font-medium">{job.title}</span>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
              {getStatusBadge(job.status)}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                <Building className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {job.department || "Engineering"}
              </span>
              <span className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {job.location || "Remote"}
              </span>
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {job.employment_type || "Full-time"}
              </span>
              <span className="flex items-center text-slate-400">
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Created{" "}
                {job.created_at
                  ? new Date(job.created_at).toLocaleDateString()
                  : "Recently"}
              </span>
            </div>
          </div>

          {/* Action Buttons for Managers/Admins */}
          {userRole !== "guest" && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onEdit(job)}
                className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Job</span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(job.id)}
                className="px-3.5 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2-Column Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Metadata & Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Details Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-medium text-slate-500 mb-1 flex items-center">
                <DollarSign className="w-3.5 h-3.5 mr-1 text-blue-600" />
                Compensation
              </div>
              <div className="text-sm font-bold text-slate-900">
                {formatSalary(job.salary_min, job.salary_max, job.currency)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-medium text-slate-500 mb-1 flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Work Location
              </div>
              <div className="text-sm font-bold text-slate-900">
                {job.location || "Remote"}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-medium text-slate-500 mb-1 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-purple-600" />
                Schedule Type
              </div>
              <div className="text-sm font-bold text-slate-900">
                {job.employment_type || "Full-time"}
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              Job Overview & Requirements
            </h3>
            <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {job.description || (
                <p className="text-slate-400 italic">
                  No detailed description provided for this job posting.
                </p>
              )}
            </div>
          </div>

          {/* Candidate Workflow / Application Tracking */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-blue-600" />
                Candidate Applications Overview
              </span>
              <span className="text-xs font-normal text-slate-500">
                Live Pipeline
              </span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-lg font-extrabold text-blue-600">12</div>
                <div className="text-xs text-slate-500 font-medium">
                  Applied
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-lg font-extrabold text-amber-600">5</div>
                <div className="text-xs text-slate-500 font-medium">
                  Under Review
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-lg font-extrabold text-purple-600">2</div>
                <div className="text-xs text-slate-500 font-medium">
                  Interviewing
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="text-lg font-extrabold text-emerald-600">1</div>
                <div className="text-xs text-slate-500 font-medium">Hired</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Status Lifecycle State Machine & Audit Trail */}
        <div className="space-y-6">
          {/* Lifecycle State Machine Controls */}
          {userRole !== "guest" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-base font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100 flex items-center">
                <UserCheck className="w-4 h-4 mr-2 text-blue-600" />
                Status Transition Lifecycle
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Transition this job posting between lifecycle states according
                to RBAC and state validation rules.
              </p>

              <div className="space-y-2.5">
                {currentStatus !== "published" && (
                  <button
                    type="button"
                    disabled={transitioning}
                    onClick={() => handleStatusTransition("published")}
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-2 shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Publish Job Posting</span>
                  </button>
                )}

                {currentStatus === "published" && (
                  <button
                    type="button"
                    disabled={transitioning}
                    onClick={() => handleStatusTransition("closed")}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-2 shadow-xs"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Close Job Posting</span>
                  </button>
                )}

                {currentStatus !== "draft" && currentStatus !== "archived" && (
                  <button
                    type="button"
                    disabled={transitioning}
                    onClick={() => handleStatusTransition("draft")}
                    className="w-full py-2 px-3 border border-amber-300 text-amber-800 hover:bg-amber-50 rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Re-open as Draft</span>
                  </button>
                )}

                {currentStatus !== "archived" && (
                  <button
                    type="button"
                    disabled={transitioning}
                    onClick={() => handleStatusTransition("archived")}
                    className="w-full py-2 px-3 border border-purple-300 text-purple-800 hover:bg-purple-50 rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-2"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Archive Job</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Audit Log Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100 flex items-center">
              <History className="w-4 h-4 mr-2 text-slate-600" />
              Audit Log History
            </h3>

            {auditLogs && auditLogs.length > 0 ? (
              <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {auditLogs.map((log) => (
                  <div key={log.id} className="relative pl-6 text-xs">
                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-600 flex items-center justify-center"></div>
                    <div className="font-semibold text-slate-800">
                      {log.action || "Status Change"}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      By {log.performed_by || "Admin User"} &bull;{" "}
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString()
                        : "Just now"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic py-2">
                Audit record created upon status transitions.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
