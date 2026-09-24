import React from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  Edit3,
  Trash2,
  ArrowUpRight,
  MapPin,
  Building,
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function JobTable({
  jobs,
  loading,
  onEdit,
  onDelete,
  onStatusChange,
  userRole = "admin",
  page = 1,
  limit = 20,
  totalJobs = 0,
  setPage,
}) {
  const getStatusBadge = (status) => {
    const st = (status || "draft").toLowerCase();
    switch (st) {
      case "published":
        return (
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-200">
            Published
          </span>
        );
      case "draft":
        return (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-200">
            Draft
          </span>
        );
      case "closed":
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full border border-slate-200">
            Closed
          </span>
        );
      case "archived":
        return (
          <span className="px-2.5 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full border border-purple-200">
            Archived
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full capitalize">
            {status}
          </span>
        );
    }
  };

  const formatSalary = (min, max, currency = "USD") => {
    if (!min && !max) return "Competitive";
    const curr = currency || "USD";
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr,
      maximumFractionDigits: 0,
    });
    if (min && max) {
      return `${formatter.format(min)} - ${formatter.format(max)}`;
    }
    if (min) return `From ${formatter.format(min)}`;
    return `Up to ${formatter.format(max)}`;
  };

  const totalPages = Math.ceil(totalJobs / limit) || 1;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
        <p className="text-slate-500 font-medium">Loading job postings...</p>
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
          <Building className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          No job postings found
        </h3>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          No job listings match your current filters. Try adjusting your search
          query or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 sm:px-6">Job Title & Department</th>
              <th className="py-3.5 px-4">Location</th>
              <th className="py-3.5 px-4">Employment Type</th>
              <th className="py-3.5 px-4">Salary Range</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right sm:px-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {jobs.map((job) => (
              <tr
                key={job.id}
                className="hover:bg-slate-50/60 transition-colors"
              >
                {/* Title & Department */}
                <td className="py-4 px-4 sm:px-6">
                  <div className="font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                    <Link to={`/jobs/${job.id}`}>{job.title}</Link>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                    <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {job.department || "General"}
                    </span>
                    {job.created_at && (
                      <span className="flex items-center text-slate-400">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </td>

                {/* Location */}
                <td className="py-4 px-4 text-slate-700 whitespace-nowrap">
                  <div className="flex items-center text-xs sm:text-sm">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1.5 flex-shrink-0" />
                    <span>{job.location || "Remote"}</span>
                  </div>
                </td>

                {/* Employment Type */}
                <td className="py-4 px-4 text-slate-700 whitespace-nowrap">
                  <span className="text-xs bg-blue-50 text-blue-700 font-medium px-2.5 py-1 rounded-md">
                    {job.employment_type || "Full-time"}
                  </span>
                </td>

                {/* Salary Range */}
                <td className="py-4 px-4 text-slate-700 font-medium whitespace-nowrap text-xs sm:text-sm">
                  {formatSalary(job.salary_min, job.salary_max, job.currency)}
                </td>

                {/* Status Badge */}
                <td className="py-4 px-4 whitespace-nowrap">
                  {getStatusBadge(job.status)}
                </td>

                {/* Actions */}
                <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end space-x-2">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="View Details"
                      aria-label={`View details for ${job.title}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    {userRole !== "guest" && (
                      <>
                        <button
                          type="button"
                          onClick={() => onEdit(job)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                          title="Edit Job"
                          aria-label={`Edit ${job.title}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(job.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Delete Job"
                          aria-label={`Delete ${job.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 sm:px-6 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-700">
            {Math.min((page - 1) * limit + 1, totalJobs)}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-slate-700">
            {Math.min(page * limit, totalJobs)}
          </span>{" "}
          of <span className="font-semibold text-slate-700">{totalJobs}</span>{" "}
          postings
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-slate-700 px-2">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
