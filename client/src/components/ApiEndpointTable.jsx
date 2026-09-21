import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Play,
  BarChart3,
  Edit2,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PauseCircle,
  Search,
  Filter,
} from "lucide-react";
import { apiService } from "../services/api";

export default function ApiEndpointTable({
  apis = [],
  isLoading = false,
  onEditApi,
  onRefreshList,
}) {
  const [filterText, setFilterText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [probingIds, setProbingIds] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const handleTriggerProbe = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setProbingIds((prev) => ({ ...prev, [id]: true }));
      setActionError(null);
      await apiService.triggerHealthCheck(id);
      if (onRefreshList) onRefreshList();
    } catch (err) {
      setActionError(
        err.response?.data?.detail || "Failed to trigger immediate probe",
      );
    } finally {
      setProbingIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDelete = async (e, id, name) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !window.confirm(
        `Are you sure you want to delete "${name}" and all its historical health logs?`,
      )
    ) {
      return;
    }
    try {
      setDeletingId(id);
      setActionError(null);
      await apiService.deleteApi(id);
      if (onRefreshList) onRefreshList();
    } catch (err) {
      setActionError(
        err.response?.data?.detail || "Failed to delete API endpoint",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filteredApis = apis.filter((api) => {
    const matchesSearch =
      api.name?.toLowerCase().includes(filterText.toLowerCase()) ||
      api.target_url?.toLowerCase().includes(filterText.toLowerCase());

    if (statusFilter === "ALL") return matchesSearch;
    if (statusFilter === "HEALTHY")
      return matchesSearch && api.current_status === "Healthy";
    if (statusFilter === "DEGRADED")
      return matchesSearch && api.current_status === "Degraded";
    if (statusFilter === "DOWN")
      return matchesSearch && api.current_status === "Down";
    if (statusFilter === "PAUSED")
      return matchesSearch && api.is_active === false;
    return matchesSearch;
  });

  const getMethodBadge = (method) => {
    switch (method?.toUpperCase()) {
      case "POST":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "HEAD":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "GET":
      default:
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
    }
  };

  const getStatusBadge = (status, isActive) => {
    if (!isActive) {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
          <PauseCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Paused</span>
        </span>
      );
    }

    switch (status) {
      case "Healthy":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Healthy</span>
          </span>
        );
      case "Degraded":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Degraded</span>
          </span>
        );
      case "Down":
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Down</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Pending Probe</span>
          </span>
        );
    }
  };

  const formatInterval = (sec) => {
    if (sec === 30) return "30s";
    if (sec === 60) return "1m";
    if (sec === 300) return "5m";
    return `${sec || 60}s`;
  };

  const formatLastChecked = (dateStr) => {
    if (!dateStr) return "Never checked";
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="bg-[#0f131c] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      {actionError && (
        <div className="p-3 bg-rose-500/10 border-b border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-400 hover:text-rose-200 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111622]">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by API name or URL..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-[#0b0f17] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center space-x-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "HEALTHY", "DEGRADED", "DOWN", "PAUSED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                statusFilter === status
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                  : "bg-slate-800/60 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#0b0f17]/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">API Endpoint</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Latency</th>
              <th className="px-4 py-3">Interval</th>
              <th className="px-4 py-3">Last Probe</th>
              <th className="px-4 py-3 text-right">Actions</th>
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
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading registered APIs...</span>
                  </div>
                </td>
              </tr>
            ) : filteredApis.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-12 text-center text-slate-400"
                >
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <AlertTriangle className="w-8 h-8 text-slate-500 mb-2" />
                    <p className="font-semibold text-slate-300">
                      No Monitored APIs Found
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {filterText || statusFilter !== "ALL"
                        ? "No APIs match the current search or status filter."
                        : "Register an API endpoint to start collecting real-time health metrics."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredApis.map((api) => {
                const isProbing = !!probingIds[api.id];
                const isDeleting = deletingId === api.id;
                return (
                  <tr
                    key={api.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* API Details */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-start space-x-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 mt-0.5 ${getMethodBadge(
                            api.http_method,
                          )}`}
                        >
                          {api.http_method || "GET"}
                        </span>
                        <div className="min-w-0">
                          <Link
                            to={`/apis/${api.id}`}
                            className="font-semibold text-slate-100 hover:text-cyan-400 transition-colors flex items-center space-x-1 truncate"
                          >
                            <span>{api.name}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" />
                          </Link>
                          <p className="text-[11px] font-mono text-slate-400 truncate max-w-xs sm:max-w-md">
                            {api.target_url}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Operational Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(api.current_status, api.is_active)}
                    </td>

                    {/* Latency */}
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono">
                      {api.last_latency_ms !== null &&
                      api.last_latency_ms !== undefined ? (
                        <div className="flex items-center space-x-2">
                          <span
                            className={
                              api.last_latency_ms > 500
                                ? "text-rose-400 font-semibold"
                                : api.last_latency_ms > 200
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                            }
                          >
                            {api.last_latency_ms.toFixed(1)} ms
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>

                    {/* Interval */}
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-400">
                      {formatInterval(api.interval_seconds)}
                    </td>

                    {/* Last Checked */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {formatLastChecked(api.last_checked_at)}
                    </td>

                    {/* Action Buttons */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Probe Now */}
                        <button
                          onClick={(e) => handleTriggerProbe(e, api.id)}
                          disabled={isProbing}
                          title="Trigger Probe Now"
                          className="p-1.5 bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 rounded border border-slate-700 transition"
                        >
                          <Play
                            className={`w-3.5 h-3.5 ${isProbing ? "animate-spin text-cyan-400" : ""}`}
                          />
                        </button>

                        {/* View Analytics */}
                        <Link
                          to={`/apis/${api.id}`}
                          title="View Telemetry Analytics"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 rounded border border-slate-700 transition"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                        </Link>

                        {/* Edit API */}
                        <button
                          onClick={() => onEditApi(api)}
                          title="Edit API Config"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 rounded border border-slate-700 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete API */}
                        <button
                          onClick={(e) => handleDelete(e, api.id, api.name)}
                          disabled={isDeleting}
                          title="Delete API"
                          className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded border border-slate-700 transition"
                        >
                          <Trash2
                            className={`w-3.5 h-3.5 ${isDeleting ? "animate-pulse text-rose-400" : ""}`}
                          />
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
    </div>
  );
}
