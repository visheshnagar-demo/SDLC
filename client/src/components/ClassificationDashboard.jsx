import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  Calendar,
  Tag,
  Mail,
  User,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Briefcase,
  UserCheck,
  Gift,
  TrendingUp,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileCode,
} from "lucide-react";
import { fetchEmails, fetchMetrics, deleteEmail } from "../services/api";

const CATEGORY_TABS = [
  { id: "ALL", label: "All Categories" },
  { id: "Work", label: "Work", icon: Briefcase },
  { id: "Personal", label: "Personal", icon: UserCheck },
  { id: "Urgent", label: "Urgent", icon: Flame },
  { id: "Promotional", label: "Promotional", icon: Gift },
];

const CATEGORY_STYLES = {
  Work: {
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    bar: "bg-blue-600",
  },
  Personal: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    bar: "bg-emerald-600",
  },
  Urgent: {
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    bar: "bg-rose-600",
  },
  Promotional: {
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    bar: "bg-purple-600",
  },
};

export const ClassificationDashboard = ({ onInspectEmail, refreshSignal }) => {
  const [emails, setEmails] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [metrics, setMetrics] = useState({
    total_processed: 0,
    work_count: 0,
    personal_count: 0,
    urgent_count: 0,
    promotional_count: 0,
    overridden_count: 0,
  });

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [minConfidence, setMinConfidence] = useState(0);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const limit = 10;

  const [isLoading, setIsLoading] = useState(false);
  const [isMetricsLoading, setIsMetricsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadMetrics = async () => {
    setIsMetricsLoading(true);
    try {
      const data = await fetchMetrics();
      setMetrics(data);
    } catch (err) {
      // Non-critical, let table load
    } finally {
      setIsMetricsLoading(false);
    }
  };

  const loadEmails = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await fetchEmails({
        category: selectedCategory,
        min_confidence: minConfidence > 0 ? minConfidence : undefined,
        search: searchQuery,
        date_from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
        date_to: dateTo ? new Date(dateTo).toISOString() : undefined,
        skip: page * limit,
        limit,
      });
      setEmails(response.items || []);
      setTotalCount(response.total || 0);
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to load classified emails.";
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedCategory,
    minConfidence,
    searchQuery,
    dateFrom,
    dateTo,
    page,
    limit,
  ]);

  useEffect(() => {
    loadMetrics();
  }, [refreshSignal]);

  useEffect(() => {
    loadEmails();
  }, [loadEmails, refreshSignal]);

  const handleResetFilters = () => {
    setSelectedCategory("ALL");
    setSearchQuery("");
    setMinConfidence(0);
    setDateFrom("");
    setDateTo("");
    setPage(0);
  };

  const handleDelete = async (emailId) => {
    if (!window.confirm("Are you sure you want to delete this email record?")) {
      return;
    }
    try {
      await deleteEmail(emailId);
      loadEmails();
      loadMetrics();
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          err.message ||
          "Failed to delete email record.",
      );
    }
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Top Metrics Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total
            </span>
            <Mail className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics.total_processed}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Total processed</p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Work
            </span>
            <Briefcase className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-blue-900">
            {metrics.work_count}
          </div>
          <p className="text-[11px] text-blue-600/80 mt-0.5">
            {metrics.total_processed > 0
              ? `${((metrics.work_count / metrics.total_processed) * 100).toFixed(0)}% of total`
              : "0% of total"}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Personal
            </span>
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-emerald-900">
            {metrics.personal_count}
          </div>
          <p className="text-[11px] text-emerald-600/80 mt-0.5">
            {metrics.total_processed > 0
              ? `${((metrics.personal_count / metrics.total_processed) * 100).toFixed(0)}% of total`
              : "0% of total"}
          </p>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Urgent
            </span>
            <Flame className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-rose-900">
            {metrics.urgent_count}
          </div>
          <p className="text-[11px] text-rose-600/80 mt-0.5">
            {metrics.total_processed > 0
              ? `${((metrics.urgent_count / metrics.total_processed) * 100).toFixed(0)}% of total`
              : "0% of total"}
          </p>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between text-purple-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Promotional
            </span>
            <Gift className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-purple-900">
            {metrics.promotional_count}
          </div>
          <p className="text-[11px] text-purple-600/80 mt-0.5">
            {metrics.total_processed > 0
              ? `${((metrics.promotional_count / metrics.total_processed) * 100).toFixed(0)}% of total`
              : "0% of total"}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Overridden
            </span>
            <Edit3 className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-amber-900">
            {metrics.overridden_count}
          </div>
          <p className="text-[11px] text-amber-600/80 mt-0.5">
            Manual user edits
          </p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(tab.id);
                  setPage(0);
                }}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.icon && <tab.icon className="h-3.5 w-3.5" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="relative md:col-span-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Search subject, sender, or text..."
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>

          {/* Confidence Slider */}
          <div className="md:col-span-3 flex flex-col justify-center">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 mb-1">
              <span className="flex items-center gap-1">
                <SlidersHorizontal className="h-3 w-3 text-indigo-600" />
                Min Confidence:
              </span>
              <span className="font-bold text-indigo-700">
                {minConfidence}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minConfidence}
              onChange={(e) => {
                setMinConfidence(Number(e.target.value));
                setPage(0);
              }}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
            />
          </div>

          {/* Date Range Inputs */}
          <div className="md:col-span-3 flex items-center gap-2">
            <div className="w-1/2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(0);
                }}
                className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <span className="text-slate-400 text-xs">-</span>
            <div className="w-1/2">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(0);
                }}
                className="w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Reset & Refresh */}
          <div className="md:col-span-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset Filters"
              className="flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={() => {
                loadEmails();
                loadMetrics();
              }}
              title="Refresh Data"
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-indigo-600" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
          {errorMessage}
        </div>
      )}

      {/* Emails Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 sm:px-6">Email / Excerpt</th>
                <th className="px-4 py-3">Sender &amp; Source</th>
                <th className="px-4 py-3">Assigned Category</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-indigo-600 mb-2" />
                    <span>Loading classified emails...</span>
                  </td>
                </tr>
              ) : emails.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <Mail className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">
                      No classified emails found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting your search filters or classify a new email
                      in the Studio.
                    </p>
                  </td>
                </tr>
              ) : (
                emails.map((email) => {
                  const classification = email.classification;
                  const primaryCategory =
                    classification?.primary_category ||
                    classification?.ai_category ||
                    "Unknown";
                  const style = CATEGORY_STYLES[primaryCategory] || {
                    badge: "bg-slate-100 text-slate-700 border-slate-200",
                    bar: "bg-slate-600",
                  };

                  return (
                    <tr
                      key={email.id}
                      className="hover:bg-slate-50/70 transition"
                    >
                      {/* Subject & Excerpt */}
                      <td className="px-4 py-3.5 sm:px-6 max-w-xs sm:max-w-md">
                        <button
                          type="button"
                          onClick={() => onInspectEmail(email)}
                          className="text-left group"
                        >
                          <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition line-clamp-1">
                            {email.subject || "(No Subject)"}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {email.excerpt}
                          </p>
                        </button>
                      </td>

                      {/* Sender & Source */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-slate-800 font-medium truncate max-w-[150px]">
                          {email.sender || "Unknown"}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          <span>{email.source_type}</span>
                          {email.file_name && (
                            <span className="text-indigo-600 truncate max-w-[100px]">
                              • {email.file_name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold ${style.badge}`}
                        >
                          <Tag className="h-3 w-3" />
                          {primaryCategory}
                        </span>
                      </td>

                      {/* Confidence Bar */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {classification ? (
                          <div className="w-24">
                            <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                              <span>
                                {classification.confidence_score.toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${style.bar}`}
                                style={{
                                  width: `${classification.confidence_score}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>

                      {/* Status (AI vs Overridden) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {classification?.is_overridden ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                            <Edit3 className="h-2.5 w-2.5" />
                            Overridden
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-200">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            AI Verified
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onInspectEmail(email)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition shadow-2xs"
                          >
                            Inspect
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(email.id)}
                            title="Delete email"
                            className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 sm:px-6 bg-slate-50/50">
          <div className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {totalCount === 0 ? 0 : page * limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-800">
              {Math.min((page + 1) * limit, totalCount)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-800">{totalCount}</span>{" "}
            emails
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page === 0 || isLoading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-medium text-slate-600">
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page + 1 >= totalPages || isLoading}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
