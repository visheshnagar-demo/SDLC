import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Plus, AlertCircle, RefreshCw } from "lucide-react";
import emailService from "../services/api";
import ReviewDashboardTable from "../components/ReviewDashboardTable";
import ManualOverrideModal from "../components/ManualOverrideModal";

export function DashboardPage() {
  const navigate = useNavigate();

  const [emails, setEmails] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters and pagination
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Manual Override Modal state
  const [selectedOverrideEmail, setSelectedOverrideEmail] = useState(null);
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        skip: (page - 1) * limit,
        limit,
      };
      if (search.trim()) {
        params.search = search.trim();
      }
      if (categoryFilter !== "All") {
        params.category = categoryFilter;
      }

      const response = await emailService.getEmails(params);
      if (Array.isArray(response)) {
        setEmails(response);
        setTotal(response.length);
      } else if (response && Array.isArray(response.items)) {
        setEmails(response.items);
        setTotal(response.total ?? response.items.length);
      } else {
        setEmails([]);
        setTotal(0);
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.detail || err.message || "Failed to load emails.";
      setError(errMsg);
      setEmails([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, categoryFilter]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Derived KPI counts
  const kpiTotal = total;
  const countUrgent = emails.filter((e) => e.category === "Urgent").length;
  const countWork = emails.filter((e) => e.category === "Work").length;
  const countPersonal = emails.filter((e) => e.category === "Personal").length;
  const countPromotional = emails.filter(
    (e) => e.category === "Promotional",
  ).length;
  const countOverridden = emails.filter((e) => e.is_overridden).length;

  const handleExportCSV = () => {
    if (emails.length === 0) return;
    const headers = [
      "ID",
      "Subject",
      "Category",
      "Confidence Score",
      "Status",
      "Is Overridden",
      "Created At",
    ];
    const rows = emails.map((e) => [
      `"${e.id || ""}"`,
      `"${(e.subject || "").replace(/"/g, '""')}"`,
      `"${e.category || ""}"`,
      `"${e.confidence_score !== undefined && e.confidence_score !== null ? e.confidence_score : ""}"`,
      `"${e.status || ""}"`,
      `"${e.is_overridden ? "true" : "false"}"`,
      `"${e.created_at || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `email_classifications_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (emailId) => {
    navigate(`/emails/${emailId}`);
  };

  const handleOpenOverride = (email) => {
    setSelectedOverrideEmail(email);
    setIsOverrideOpen(true);
  };

  const handleOverrideSaved = (updatedEmail) => {
    setEmails((prev) =>
      prev.map((item) => (item.id === updatedEmail.id ? updatedEmail : item)),
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Classification Review Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Real-time AI pipeline inference, categorization, and confidence
            metrics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            disabled={emails.length === 0}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => navigate("/upload")}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm shadow-indigo-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Batch</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Total Emails
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{kpiTotal}</p>
          <span className="text-xs text-indigo-600 font-medium">In system</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-rose-500">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Urgent
          </p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{countUrgent}</p>
          <span className="text-xs text-rose-500 font-medium">
            High priority
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-sky-500">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Work
          </p>
          <p className="text-2xl font-bold text-sky-600 mt-1">{countWork}</p>
          <span className="text-xs text-sky-600 font-medium">
            Internal & Ops
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Personal
          </p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {countPersonal}
          </p>
          <span className="text-xs text-emerald-600 font-medium">
            Direct Comms
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-purple-500">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Promotional
          </p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {countPromotional}
          </p>
          <span className="text-xs text-purple-600 font-medium">Marketing</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Overridden
          </p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {countOverridden}
          </p>
          <span className="text-xs text-amber-600 font-medium">
            Manual Edits
          </span>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div
          className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-center justify-between"
          role="alert"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchEmails}
            className="inline-flex items-center space-x-1 px-3 py-1 bg-white border border-rose-300 rounded-md text-xs font-medium text-rose-700 hover:bg-rose-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Main Table */}
      <ReviewDashboardTable
        emails={emails}
        loading={loading}
        onView={handleView}
        onOverride={handleOpenOverride}
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        categoryFilter={categoryFilter}
        onCategoryChange={(val) => {
          setCategoryFilter(val);
          setPage(1);
        }}
        total={total}
        page={page}
        limit={limit}
        onPageChange={(newPage) => setPage(newPage)}
      />

      {/* Manual Override Modal */}
      <ManualOverrideModal
        isOpen={isOverrideOpen}
        email={selectedOverrideEmail}
        onClose={() => {
          setIsOverrideOpen(false);
          setSelectedOverrideEmail(null);
        }}
        onSaved={handleOverrideSaved}
      />
    </div>
  );
}

export default DashboardPage;
