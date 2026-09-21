import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  AlertOctagon,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Terminal,
  ShieldAlert,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import FailureInspectorDrawer from "../components/FailureInspectorDrawer";
import { getGlobalFailures, getDashboardSummary } from "../services/api";

export default function FailuresPage() {
  const [failures, setFailures] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedFailure, setSelectedFailure] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [error, setError] = useState(null);

  const fetchFailures = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    setError(null);
    try {
      const [failuresRes, summaryRes] = await Promise.all([
        getGlobalFailures({ limit: 100, offset: 0 }),
        getDashboardSummary(),
      ]);
      setFailures(failuresRes || []);
      setSummary(summaryRes);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to fetch failure logs.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFailures();
    const interval = setInterval(() => {
      fetchFailures();
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchFailures]);

  const handleInspect = (failure) => {
    setSelectedFailure(failure);
    setIsInspectorOpen(true);
  };

  const filteredFailures = failures.filter((f) => {
    const matchesSearch =
      (f.api_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.target_url || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.error_message || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "all") return true;
    if (statusFilter === "5xx")
      return f.response_status >= 500 && f.response_status < 600;
    if (statusFilter === "4xx")
      return f.response_status >= 400 && f.response_status < 500;
    if (statusFilter === "timeout")
      return !f.response_status || f.operational_status === "Down";
    return true;
  });

  const activeFailuresCount = summary?.active_failures || 0;

  return (
    <DashboardLayout
      onRefresh={() => fetchFailures(true)}
      isRefreshing={isRefreshing}
      systemStatus={activeFailuresCount > 0 ? "Degraded" : "Operational"}
      activeFailuresCount={activeFailuresCount}
    >
      <div className="space-y-6">
        {/* Outage Alert Header */}
        <div className="bg-[#111622] rounded-2xl border border-rose-500/30 p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-100">
                  API Failure Inspector
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {filteredFailures.length} Total Incidents
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Diagnostic audit trail of HTTP 4xx/5xx responses, timeouts, and
                network outages
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchFailures(true)}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition self-start sm:self-auto"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`}
            />
            <span>Refresh Incidents</span>
          </button>
        </div>

        {/* Global Error Notice */}
        {error && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchFailures(true)}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded text-rose-200 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111622] p-4 rounded-2xl border border-slate-800 shadow-xl">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by endpoint, URL, or error reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-400 outline-none"
            />
          </div>

          <div className="flex items-center bg-[#0b0f17] p-1 rounded-lg border border-slate-800 text-xs">
            {["all", "5xx", "4xx", "timeout"].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1 rounded uppercase font-mono font-medium transition ${
                  statusFilter === f
                    ? "bg-slate-800 text-rose-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Failure Log Table */}
        <div className="bg-[#111622] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-[#0f131c]/50 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">Endpoint</th>
                  <th className="py-3 px-3">Status Code</th>
                  <th className="py-3 px-3">Latency</th>
                  <th className="py-3 px-4">Diagnostic Error</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredFailures.length > 0 ? (
                  filteredFailures.map((failure) => (
                    <tr
                      key={failure.id}
                      onClick={() => handleInspect(failure)}
                      className="hover:bg-rose-950/20 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                        {new Date(failure.checked_at).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex flex-col">
                          <Link
                            to={`/apis/${failure.api_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-semibold text-slate-200 hover:text-cyan-400 flex items-center space-x-1 transition"
                          >
                            <span>{failure.api_name || failure.api_id}</span>
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                          </Link>
                          <span className="text-[11px] text-slate-400 font-mono truncate max-w-xs sm:max-w-sm">
                            {failure.target_url}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap font-mono">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          {failure.response_status
                            ? `HTTP ${failure.response_status}`
                            : "TIMEOUT"}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap font-mono text-rose-400 font-semibold">
                        {failure.latency_ms?.toFixed(1) || 0} ms
                      </td>

                      <td className="py-3.5 px-4 text-rose-300">
                        <span className="truncate max-w-xs sm:max-w-md block font-mono">
                          {failure.error_message ||
                            "Probe timeout or connection reset."}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInspect(failure);
                          }}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium transition"
                        >
                          Inspect Log
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div className="text-slate-200 font-bold text-sm">
                          No failure events recorded!
                        </div>
                        <p className="text-xs text-slate-500 max-w-sm">
                          All registered APIs are responding within SLA
                          thresholds and expected HTTP status codes.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Failure Inspector Drawer */}
      <FailureInspectorDrawer
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        failureLog={selectedFailure}
      />
    </DashboardLayout>
  );
}
