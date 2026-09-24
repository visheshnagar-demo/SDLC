import React, { useState } from "react";
import Badge from "../common/Badge";
import {
  History,
  User,
  Clock,
  ChevronDown,
  ChevronRight,
  FileText,
} from "lucide-react";

export const AuditLogLedger = ({ logs = [], isLoading = false }) => {
  const [expandedLogId, setExpandedLogId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  const getActionBadgeColor = (action) => {
    const act = String(action || "").toUpperCase();
    if (act.includes("CREATE") || act.includes("LINK")) return "success";
    if (act.includes("DELETE") || act.includes("UNLINK")) return "error";
    if (act.includes("DEPLOY")) return "primary";
    if (act.includes("UPDATE") || act.includes("STATUS")) return "warning";
    return "neutral";
  };

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800">
        <h3 className="text-base font-bold text-[#dae2fd]">
          Audit Log & Event History ({logs.length})
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Immutable chronological event stream recording all lifecycle mutations
          and actors.
        </p>
      </div>

      {/* Logs Stream */}
      {isLoading ? (
        <div className="p-10 text-center text-slate-400">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs">Loading audit trail...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-10 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <History className="w-8 h-8 text-slate-600" />
          <p className="text-sm font-medium text-slate-300">
            No audit events recorded
          </p>
          <p className="text-xs text-slate-500 max-w-sm">
            Audit logs will be generated automatically as actions occur on this
            release.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60">
          {logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const hasDetails =
              log.details &&
              (typeof log.details === "object"
                ? Object.keys(log.details).length > 0
                : true);

            return (
              <div
                key={log.id}
                className="p-4 hover:bg-slate-800/20 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {hasDetails && (
                      <button
                        onClick={() => toggleExpand(log.id)}
                        className="text-slate-500 hover:text-slate-300 p-0.5"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <Badge variant={getActionBadgeColor(log.action)} size="sm">
                      {log.action}
                    </Badge>
                    <span className="text-xs font-mono font-medium text-[#dae2fd]">
                      {log.entity_type}{" "}
                      {log.entity_id ? `(${log.entity_id.slice(0, 8)}...)` : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 ml-6 sm:ml-0">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{log.changed_by || "system"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString(undefined, {
                              dateStyle: "short",
                              timeStyle: "medium",
                            })
                          : "Recently"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && hasDetails && (
                  <div className="mt-3 ml-6 p-3 bg-[#0b0f19] rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                    <pre className="whitespace-pre-wrap">
                      {typeof log.details === "object"
                        ? JSON.stringify(log.details, null, 2)
                        : String(log.details)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AuditLogLedger;
