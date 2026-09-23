import React from "react";
import {
  Search,
  Eye,
  Edit3,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import CategoryBadge from "./CategoryBadge";

const CATEGORIES = [
  "All",
  "Work",
  "Personal",
  "Urgent",
  "Promotional",
  "Uncategorized",
];

export function ReviewDashboardTable({
  emails = [],
  loading = false,
  onView,
  onOverride,
  search = "",
  onSearchChange,
  categoryFilter = "All",
  onCategoryChange,
  total = 0,
  page = 1,
  limit = 20,
  onPageChange,
}) {
  const totalPages = Math.ceil(total / limit) || 1;

  const formatDate = (isoString) => {
    if (!isoString) return "—";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Filter Bar */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search subject or body..."
              aria-label="Search emails"
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            aria-label="Filter by Category"
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "All" ? "Category: All" : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Component */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th scope="col" className="p-4">
                Subject & Preview
              </th>
              <th scope="col" className="p-4">
                AI Category
              </th>
              <th scope="col" className="p-4">
                Status
              </th>
              <th scope="col" className="p-4">
                Format
              </th>
              <th scope="col" className="p-4">
                Ingested
              </th>
              <th scope="col" className="p-4 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`loading-row-${i}`} className="animate-pulse">
                  <td className="p-4 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </td>
                  <td className="p-4">
                    <div className="h-6 bg-slate-200 rounded-full w-24" />
                  </td>
                  <td className="p-4">
                    <div className="h-4 bg-slate-200 rounded w-16" />
                  </td>
                  <td className="p-4">
                    <div className="h-4 bg-slate-200 rounded w-12" />
                  </td>
                  <td className="p-4">
                    <div className="h-4 bg-slate-200 rounded w-20" />
                  </td>
                  <td className="p-4 text-right">
                    <div className="h-7 bg-slate-200 rounded w-28 ml-auto" />
                  </td>
                </tr>
              ))
            ) : emails.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-base font-semibold text-slate-700">
                    No emails found
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Upload an email file or paste text to start automatic AI
                    classification.
                  </p>
                </td>
              </tr>
            ) : (
              emails.map((email) => (
                <tr
                  key={email.id}
                  className="hover:bg-slate-50 transition-colors group"
                >
                  <td className="p-4 max-w-md">
                    <p className="font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {email.subject || "(No Subject)"}
                    </p>
                    <p className="text-xs text-slate-500 truncate max-w-lg mt-0.5">
                      {email.preview || email.body || "No preview available"}
                    </p>
                  </td>
                  <td className="p-4">
                    <CategoryBadge
                      category={email.category}
                      confidenceScore={email.confidence_score}
                      isOverridden={email.is_overridden}
                    />
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center text-xs font-medium text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                      {email.status || "PROCESSED"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-mono">
                      {email.file_type ||
                        (email.file_name
                          ? email.file_name.split(".").pop()
                          : "text")}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(email.created_at)}
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => onView && onView(email.id)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                      title="View email detail"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => onOverride && onOverride(email)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md text-xs font-medium hover:bg-indigo-100 transition-colors"
                      title="Override category"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Override</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 text-xs text-slate-600">
          <span>
            Showing page{" "}
            <span className="font-semibold text-slate-900">{page}</span> of{" "}
            <span className="font-semibold text-slate-900">{totalPages}</span> (
            {total} total emails)
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors flex items-center space-x-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors flex items-center space-x-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewDashboardTable;
