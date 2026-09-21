import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Play,
  Edit2,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

export default function ApiEndpointTable({
  apis = [],
  onTriggerCheck,
  onEdit,
  onDelete,
  onOpenRegister,
  isProbing = false,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredApis = apis.filter((api) => {
    const matchesSearch =
      api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      api.target_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      api.http_method.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "all") return true;
    if (statusFilter === "healthy")
      return api.current_status?.toLowerCase() === "healthy";
    if (statusFilter === "degraded")
      return api.current_status?.toLowerCase() === "degraded";
    if (statusFilter === "down")
      return api.current_status?.toLowerCase() === "down";
    if (statusFilter === "active") return api.is_active === true;
    if (statusFilter === "inactive") return api.is_active === false;
    return true;
  });

  const getStatusBadge = (status) => {
    const s = (status || "unknown").toLowerCase();
    if (s === "healthy") {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Healthy</span>
        </span>
      );
    }
    if (s === "degraded") {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Degraded</span>
        </span>
      );
    }
    if (s === "down") {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <XCircle className="w-3.5 h-3.5" />
          <span>Down</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
        <Clock className="w-3.5 h-3.5" />
        <span>Pending</span>
      </span>
    );
  };

  const getMethodBadge = (method) => {
    const m = (method || "GET").toUpperCase();
    const colors = {
      GET: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      POST: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      HEAD: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
          colors[m] || "bg-slate-800 text-slate-300 border-slate-700"
        }`}
      >
        {m}
      </span>
    );
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return "Never";
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-[#111622] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center space-x-2">
            <span>Monitored API Endpoints</span>
            <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-400 rounded-full font-mono font-normal">
              {filteredApis.length} of {apis.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time status, latency metrics, and probe cadence
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, URL, or method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0b0f17] border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-400 outline-none w-56 sm:w-64"
            />
          </div>

          {/* Status filter pills */}
          <div className="flex items-center bg-[#0b0f17] p-1 rounded-lg border border-slate-800 text-xs">
            {["all", "healthy", "degraded", "down"].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1 rounded capitalize font-medium transition ${
                  statusFilter === f
                    ? "bg-slate-800 text-cyan-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-[#0f131c]/50 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">Endpoint</th>
              <th className="py-3 px-3">Method</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Last Latency</th>
              <th className="py-3 px-3">Uptime (24h)</th>
              <th className="py-3 px-3">Cadence</th>
              <th className="py-3 px-3">Last Checked</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filteredApis.length > 0 ? (
              filteredApis.map((api) => {
                const uptime24h =
                  api.stats_24h?.uptime_pct !== undefined
                    ? `${api.stats_24h.uptime_pct}%`
                    : "--";

                return (
                  <tr
                    key={api.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <Link
                          to={`/apis/${api.id}`}
                          className="font-semibold text-slate-200 hover:text-cyan-400 flex items-center space-x-1.5 transition-colors"
                        >
                          <span>{api.name}</span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400" />
                        </Link>
                        <span className="text-[11px] text-slate-400 font-mono truncate max-w-xs sm:max-w-md mt-0.5">
                          {api.target_url}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {getMethodBadge(api.http_method)}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {getStatusBadge(api.current_status)}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap font-mono font-medium">
                      {api.last_latency_ms !== null &&
                      api.last_latency_ms !== undefined ? (
                        <span
                          className={
                            api.last_latency_ms > 1000
                              ? "text-rose-400"
                              : api.last_latency_ms > 300
                                ? "text-amber-400"
                                : "text-emerald-400"
                          }
                        >
                          {api.last_latency_ms.toFixed(1)} ms
                        </span>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap font-mono">
                      <span className="text-slate-300">{uptime24h}</span>
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-400 font-mono">
                      {api.interval_seconds}s
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap text-slate-400">
                      {formatTimestamp(api.last_checked_at)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() =>
                            onTriggerCheck && onTriggerCheck(api.id)
                          }
                          disabled={isProbing}
                          title="Trigger Health Probe Now"
                          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-md transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          to={`/apis/${api.id}`}
                          title="View Telemetry & Analytics"
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => onEdit && onEdit(api)}
                          title="Edit Configuration"
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-md transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete && onDelete(api.id)}
                          title="Delete API Endpoint"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-12 px-4 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 border border-slate-700">
                      <Search className="w-5 h-5" />
                    </div>
                    <div className="text-slate-300 font-medium">
                      {apis.length === 0
                        ? "No API endpoints registered yet."
                        : "No API endpoints matching criteria."}
                    </div>
                    <p className="text-xs text-slate-500 max-w-sm">
                      {apis.length === 0
                        ? "Get started by registering your first HTTP endpoint for automated health checks."
                        : "Try adjusting your search query or status filter above."}
                    </p>
                    {apis.length === 0 && onOpenRegister && (
                      <button
                        onClick={onOpenRegister}
                        className="mt-2 px-4 py-2 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg shadow-md shadow-cyan-500/20"
                      >
                        + Register First API
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
