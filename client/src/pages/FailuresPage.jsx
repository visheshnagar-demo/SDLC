import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Clock,
} from "lucide-react";
import FailureInspectorDrawer from "../components/FailureInspectorDrawer";
import { apiService } from "../services/api";

export default function FailuresPage({ refreshTrigger }) {
  const [failures, setFailures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterText, setFilterText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [alertAcknowledged, setAlertAcknowledged] = useState(false);

  const [selectedFailure, setSelectedFailure] = useState(null);

  const loadFailures = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getRecentFailures({ limit: 100 });
      const failureList = Array.isArray(data) ? data : data.items || [];
      setFailures(failureList);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to retrieve failure logs",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFailures();
  }, [loadFailures, refreshTrigger]);

  const filteredFailures = failures.filter((item) => {
    const matchesSearch =
      (item.api_name &&
        item.api_name.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.target_url &&
        item.target_url.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.error_message &&
        item.error_message.toLowerCase().includes(filterText.toLowerCase()));

    if (statusFilter === "ALL") return matchesSearch;
    if (statusFilter === "500")
      return matchesSearch && item.response_status === 500;
    if (statusFilter === "502")
      return matchesSearch && item.response_status === 502;
    if (statusFilter === "504")
      return matchesSearch && item.response_status === 504;
    if (statusFilter === "TIMEOUT")
      return (
        matchesSearch && (item.response_status === 0 || !item.response_status)
      );
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Critical Alert Banner (if outages exist and not acknowledged) */}
      {!alertAcknowledged && failures.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-400 animate-bounce" />
            </div>
            <div>
              <span className="font-bold text-slate-100">CRITICAL ALERT:</span>{" "}
              <span>
                {failures.length} Active Outages / Failed Probes Detected in
                cluster
              </span>
            </div>
          </div>
          <button
            onClick={() => setAlertAcknowledged(true)}
            className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs rounded-lg transition shadow-md"
          >
            Acknowledge Alert
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#0f131c] border border-slate-800 p-6 rounded-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
            <span>API Failure Inspector &amp; Diagnostic Logs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Detailed inspection of HTTP error codes, request headers, error
            messages, and payload bodies.
          </p>
        </div>

        <button
          onClick={loadFailures}
          className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center space-x-1.5 transition"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`}
          />
          <span>Refresh Failures</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0f131c] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111622]">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by endpoint, URL, or error..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center space-x-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 font-mono text-xs">
            {["ALL", "500", "502", "504", "TIMEOUT"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded transition ${
                  statusFilter === st
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold"
                    : "bg-slate-800/60 text-slate-400 border border-slate-800 hover:text-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Failures Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0b0f17] text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Endpoint / URL</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Latency</th>
                <th className="px-4 py-3">Diagnostic Message</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading failure logs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredFailures.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2" />
                      <p className="font-bold text-slate-200 text-sm">
                        No Failures Recorded
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {filterText || statusFilter !== "ALL"
                          ? "No failures match the selected status or query."
                          : "All monitored APIs are healthy and responding within SLA."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFailures.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/40 transition group"
                  >
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-400 text-[11px]">
                      {item.checked_at
                        ? new Date(item.checked_at).toLocaleString()
                        : "--"}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        {item.api_id ? (
                          <Link
                            to={`/apis/${item.api_id}`}
                            className="font-semibold text-slate-100 hover:text-cyan-400 transition flex items-center space-x-1"
                          >
                            <span>
                              {item.api_name ||
                                `API #${item.api_id.slice(0, 8)}`}
                            </span>
                            <ExternalLink className="w-3 h-3 text-cyan-400 opacity-0 group-hover:opacity-100" />
                          </Link>
                        ) : (
                          <span className="font-semibold text-slate-100">
                            {item.api_name || "Target API"}
                          </span>
                        )}
                        <p className="text-[11px] font-mono text-slate-400 truncate max-w-xs">
                          {item.target_url || "--"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        {item.response_status
                          ? `HTTP ${item.response_status}`
                          : "TIMEOUT / ERR"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-amber-400">
                      {item.latency_ms !== null && item.latency_ms !== undefined
                        ? `${item.latency_ms.toFixed(1)} ms`
                        : "--"}
                    </td>
                    <td className="px-4 py-3 max-w-sm">
                      <p className="font-mono text-xs text-rose-300 truncate">
                        {item.error_message ||
                          "Probe returned non-200 status code"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedFailure(item)}
                        className="px-3 py-1 bg-slate-800 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-400 border border-slate-700 rounded text-xs font-medium transition"
                      >
                        Inspect Payload
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Failure Inspector Drawer */}
      {selectedFailure && (
        <FailureInspectorDrawer
          isOpen={!!selectedFailure}
          logEntry={selectedFailure}
          onClose={() => setSelectedFailure(null)}
        />
      )}
    </div>
  );
}
