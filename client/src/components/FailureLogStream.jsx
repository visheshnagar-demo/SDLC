import React from "react";
import { StatusBadge } from "./StatusBadge";
import { Eye, ShieldAlert, CheckCircle2 } from "lucide-react";

export const FailureLogStream = ({
  logs = [],
  onSelectLog,
  isLoading = false,
  filterStatus = "ALL",
  onFilterChange,
}) => {
  const formatTimestamp = (ts) => {
    if (!ts) return "--";
    try {
      const d = new Date(ts);
      return (
        d.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) +
        " " +
        d.toLocaleDateString()
      );
    } catch {
      return ts;
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterStatus === "ALL") return true;
    return (log.status || "").toUpperCase() === filterStatus.toUpperCase();
  });

  if (isLoading && logs.length === 0) {
    return (
      <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-12 text-center">
        <div className="inline-block w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-[#94a3b8]">
          Fetching failure telemetry stream...
        </p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div
        data-testid="failure-logs-empty"
        className="bg-[#111827] border border-[#1e293b] rounded-xl p-12 text-center"
      >
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-[#f8fafc]">
          All Services Operational
        </h3>
        <p className="text-sm text-[#94a3b8] max-w-md mx-auto mt-1">
          Zero anomalous or failing health check events recorded in the current
          filter window.
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="failure-logs-container"
      className="bg-[#111827] border border-[#1e293b] rounded-xl overflow-hidden shadow-xl"
    >
      {/* Header with filter tabs */}
      <div className="p-4 border-b border-[#1e293b] bg-[#0b0f17]/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-rose-400 w-5 h-5" />
          <h3 className="font-semibold text-sm text-[#f8fafc]">
            Failure & Degradation Stream
          </h3>
          <span className="text-xs bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full font-mono font-semibold border border-rose-500/20">
            {filteredLogs.length} events
          </span>
        </div>

        {onFilterChange && (
          <div className="flex items-center gap-1 bg-[#0b0f17] p-1 rounded-lg border border-[#1e293b] text-xs font-medium">
            {["ALL", "UNHEALTHY", "DEGRADED"].map((st) => (
              <button
                key={st}
                onClick={() => onFilterChange(st)}
                className={`px-3 py-1 rounded-md transition ${
                  filterStatus === st
                    ? "bg-[#1e293b] text-[#f8fafc] font-semibold text-[#06b6d4]"
                    : "text-[#94a3b8] hover:text-[#f8fafc]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#1e293b] bg-[#0b0f17]/60 text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Service & Endpoint</th>
              <th className="py-3 px-3">State</th>
              <th className="py-3 px-3">HTTP Code</th>
              <th className="py-3 px-4">Latency</th>
              <th className="py-3 px-4">Diagnostic Error</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]">
            {filteredLogs.map((log) => (
              <tr
                key={log.id}
                data-testid={`failure-row-${log.id}`}
                className="hover:bg-[#1e293b]/40 transition group cursor-pointer"
                onClick={() => onSelectLog && onSelectLog(log)}
              >
                <td className="py-3.5 px-4 font-mono text-xs text-[#94a3b8] whitespace-nowrap">
                  {formatTimestamp(log.executed_at || log.created_at)}
                </td>

                <td className="py-3.5 px-4">
                  <div className="font-semibold text-[#f8fafc] group-hover:text-cyan-400 transition">
                    {log.monitor_name || log.monitor_id || "Unknown Service"}
                  </div>
                  <div className="text-xs font-mono text-slate-400 truncate max-w-xs">
                    {log.endpoint_url || log.url || "--"}
                  </div>
                </td>

                <td className="py-3.5 px-3">
                  <StatusBadge status={log.status || "UNHEALTHY"} size="sm" />
                </td>

                <td className="py-3.5 px-3 font-mono text-xs">
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      log.status_code >= 500
                        ? "bg-rose-500/20 text-rose-300"
                        : log.status_code >= 400
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {log.status_code ?? "ERR"}
                  </span>
                </td>

                <td className="py-3.5 px-4 font-mono text-xs text-[#f8fafc] whitespace-nowrap">
                  {log.latency_ms !== undefined && log.latency_ms !== null
                    ? `${Number(log.latency_ms).toFixed(1)} ms`
                    : "--"}
                </td>

                <td className="py-3.5 px-4 max-w-xs">
                  <div
                    className="text-xs text-rose-400 font-mono truncate"
                    title={log.error_message}
                  >
                    {log.error_message || "Timeout / Connection Failure"}
                  </div>
                </td>

                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLog && onSelectLog(log);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-[#1e293b] text-slate-300 hover:text-cyan-400 transition"
                    aria-label="View diagnostic details"
                  >
                    <Eye size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FailureLogStream;
