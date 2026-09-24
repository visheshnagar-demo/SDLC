import React from "react";
import { StatusBadge } from "./StatusBadge";
import { Play, Edit2, Trash2, Globe, ArrowUpRight, Power } from "lucide-react";

export const MonitorsTable = ({
  monitors = [],
  onRunCheck,
  onEdit,
  onDelete,
  onToggleActive,
  isLoading = false,
  runningCheckId = null,
}) => {
  const formatLatency = (latency) => {
    if (latency === null || latency === undefined) return "--";
    return `${Number(latency).toFixed(1)} ms`;
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "Never checked";
    try {
      const date = new Date(ts);
      return (
        date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) +
        " " +
        date.toLocaleDateString()
      );
    } catch {
      return ts;
    }
  };

  const getMethodColor = (method) => {
    switch ((method || "").toUpperCase()) {
      case "GET":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "POST":
        return "text-sky-400 bg-sky-500/10 border-sky-500/20";
      case "PUT":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "DELETE":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "PATCH":
        return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      default:
        return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  if (isLoading && monitors.length === 0) {
    return (
      <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-12 text-center">
        <div className="inline-block w-8 h-8 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-[#94a3b8]">Loading monitored endpoints...</p>
      </div>
    );
  }

  if (monitors.length === 0) {
    return (
      <div
        data-testid="monitors-empty-state"
        className="bg-[#111827] border border-[#1e293b] rounded-xl p-12 text-center"
      >
        <Globe className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-[#f8fafc]">
          No Monitored APIs Registered
        </h3>
        <p className="text-sm text-[#94a3b8] max-w-md mx-auto mt-1">
          Register your first target API endpoint to begin real-time status
          monitoring, latency tracking, and anomaly detection.
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="monitors-table-container"
      className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden shadow-xl"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1e293b] bg-[#0b0f17]/60 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
              <th className="py-3.5 px-4">Service & Endpoint</th>
              <th className="py-3.5 px-3">Method</th>
              <th className="py-3.5 px-3">Interval / Timeout</th>
              <th className="py-3.5 px-3">Expected Code</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Latency</th>
              <th className="py-3.5 px-4">Last Probe</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b] text-sm">
            {monitors.map((monitor) => {
              const isChecking = runningCheckId === monitor.id;
              return (
                <tr
                  key={monitor.id}
                  data-testid={`monitor-row-${monitor.id}`}
                  className="hover:bg-[#1e293b]/40 transition group"
                >
                  {/* Service & Endpoint */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#f8fafc] group-hover:text-[#06b6d4] transition">
                          {monitor.name}
                        </span>
                        {!monitor.is_active && (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                            PAUSED
                          </span>
                        )}
                      </div>
                      <a
                        href={monitor.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-mono text-[#94a3b8] hover:text-[#38bdf8] truncate max-w-xs flex items-center gap-1 mt-0.5"
                      >
                        <span className="truncate">{monitor.url}</span>
                        <ArrowUpRight
                          size={12}
                          className="shrink-0 opacity-70"
                        />
                      </a>
                    </div>
                  </td>

                  {/* Method */}
                  <td className="py-4 px-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-mono font-bold border ${getMethodColor(
                        monitor.http_method,
                      )}`}
                    >
                      {monitor.http_method || "GET"}
                    </span>
                  </td>

                  {/* Interval / Timeout */}
                  <td className="py-4 px-3 text-xs text-[#94a3b8] font-mono">
                    <div>{monitor.check_interval_seconds}s interval</div>
                    <div className="text-slate-500">
                      {monitor.timeout_ms}ms max
                    </div>
                  </td>

                  {/* Expected Code */}
                  <td className="py-4 px-3">
                    <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded text-xs font-mono">
                      {monitor.expected_status_code || 200}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    <StatusBadge
                      status={
                        monitor.current_status ||
                        (monitor.is_active ? "PENDING" : "INACTIVE")
                      }
                      size="sm"
                    />
                  </td>

                  {/* Latency */}
                  <td className="py-4 px-4 font-mono text-xs text-[#f8fafc]">
                    {formatLatency(
                      monitor.last_latency_ms ?? monitor.latency_ms,
                    )}
                  </td>

                  {/* Last Probe */}
                  <td className="py-4 px-4 text-xs font-mono text-[#94a3b8]">
                    {formatTimestamp(monitor.last_checked_at)}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Trigger check */}
                      <button
                        title="Run check now"
                        disabled={isChecking}
                        onClick={() => onRunCheck && onRunCheck(monitor.id)}
                        className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-[#06b6d4] border border-cyan-500/20 transition disabled:opacity-50"
                        aria-label={`Run check for ${monitor.name}`}
                      >
                        {isChecking ? (
                          <div className="w-3.5 h-3.5 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Play size={14} />
                        )}
                      </button>

                      {/* Edit */}
                      <button
                        title="Edit monitor"
                        onClick={() => onEdit && onEdit(monitor)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                        aria-label={`Edit ${monitor.name}`}
                      >
                        <Edit2 size={14} />
                      </button>

                      {/* Toggle Active/Pause */}
                      <button
                        title={
                          monitor.is_active
                            ? "Pause monitoring"
                            : "Resume monitoring"
                        }
                        onClick={() =>
                          onToggleActive && onToggleActive(monitor)
                        }
                        className={`p-1.5 rounded-lg border transition ${
                          monitor.is_active
                            ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                        }`}
                        aria-label={
                          monitor.is_active
                            ? `Pause ${monitor.name}`
                            : `Resume ${monitor.name}`
                        }
                      >
                        <Power size={14} />
                      </button>

                      {/* Delete */}
                      <button
                        title="Delete monitor"
                        onClick={() => onDelete && onDelete(monitor.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                        aria-label={`Delete ${monitor.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonitorsTable;
