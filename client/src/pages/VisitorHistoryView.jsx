import React, { useState, useEffect } from "react";
import KPIMetricsBar from "../components/KPIMetricsBar";
import AuditHistoryDataTable from "../components/AuditHistoryDataTable";
import { historyService, visitorService, authService } from "../services/api";
import {
  History,
  Filter,
  RefreshCw,
  Search,
  Calendar,
  X,
  KeyRound,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";

export default function VisitorHistoryView({ currentUser, onUserChange }) {
  const [visits, setVisits] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [hosts, setHosts] = useState([]);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "",
    hostId: "",
    visitorName: "",
  });

  // Auth login state if unauthenticated
  const [loginEmail, setLoginEmail] = useState("admin@example.com");
  const [loginPassword, setLoginPassword] = useState("adminpassword");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const fetchHistory = async (targetSkip = skip) => {
    if (!currentUser) return;
    setLoading(true);
    setError("");

    try {
      const params = {
        skip: targetSkip,
        limit,
      };
      if (filters.startDate)
        params.start_date = new Date(filters.startDate).toISOString();
      if (filters.endDate)
        params.end_date = new Date(filters.endDate).toISOString();
      if (filters.status) params.status = filters.status;
      if (filters.hostId) params.host_id = filters.hostId;
      if (filters.visitorName.trim())
        params.visitor_name = filters.visitorName.trim();

      const data = await historyService.getHistory(params);
      setVisits(data.items || []);
      setTotal(data.total || 0);
      setSkip(targetSkip);
    } catch (err) {
      setError(err.message || "Failed to load visitor history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadHosts = async () => {
      try {
        const data = await visitorService.getHosts();
        setHosts(data || []);
      } catch {
        // hosts optional
      }
    };
    loadHosts();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchHistory(0);
    }
  }, [currentUser, filters.status, filters.hostId]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchHistory(0);
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      status: "",
      hostId: "",
      visitorName: "",
    });
    setSkip(0);
  };

  const handleInlineLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const data = await authService.login(loginEmail, loginPassword);
      if (onUserChange) onUserChange(data.user);
    } catch (err) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">Audit History Access</h2>
            <p className="text-slate-300 text-xs mt-1">
              Sign in as Admin, Receptionist, or Host to view historical visit
              logs.
            </p>
          </div>

          <form onSubmit={handleInlineLogin} className="p-6 space-y-4">
            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Admin / Staff Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-xs">
              <span className="font-semibold text-slate-700 block">
                Admin Test Account:
              </span>
              <div className="text-slate-600 font-mono text-[11px]">
                admin@example.com / adminpassword
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md transition-colors disabled:opacity-50"
            >
              {authLoading ? "Signing In..." : "Sign In to Access Logs"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Audit & Compliance Trail</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Visitor History & Analytics
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Searchable historical records of all visitor arrivals, host
            approvals, and departure timestamps.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchHistory(skip)}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 mr-1.5 text-indigo-600 ${loading ? "animate-spin" : ""}`}
          />
          Refresh Logs
        </button>
      </div>

      {/* KPI Metrics Bar */}
      <KPIMetricsBar visits={visits} total={total} />

      {/* Multi-Parameter Filters */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <form onSubmit={handleFilterSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Visitor Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Visitor Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={filters.visitorName}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      visitorName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Filter by Status */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Visit Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="CHECKED_IN">Checked-In (On-Premises)</option>
                <option value="CHECKED_OUT">Checked-Out</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Filter by Host */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Host Employee
              </label>
              <select
                value={filters.hostId}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, hostId: e.target.value }))
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">All Host Staff</option>
                {hosts.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Scheduled From
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Scheduled Until
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              Reset Filters
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors"
            >
              <Search className="w-3.5 h-3.5 mr-1.5" />
              Apply Filter Query
            </button>
          </div>
        </form>
      </div>

      {/* Audit Logs Data Table */}
      <AuditHistoryDataTable
        visits={visits}
        total={total}
        skip={skip}
        limit={limit}
        loading={loading}
        error={error}
        filters={filters}
        onPageChange={(newSkip) => fetchHistory(newSkip)}
      />
    </div>
  );
}
