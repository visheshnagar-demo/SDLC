import React from "react";
import { History, Shield, Activity, UserCheck } from "lucide-react";

export default function AuditLogTimeline({ logs = [], loading = false }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center space-x-2 text-indigo-600 mb-4 pb-3 border-b border-slate-100">
        <History className="w-5 h-5" />
        <h3 className="font-bold text-slate-900 text-sm">
          Administrative Audit Trail
        </h3>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500">
          <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent mb-2"></div>
          <p>Fetching audit logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No audit log records recorded for this tenant yet.
        </div>
      ) : (
        <div className="relative border-l border-slate-200 ml-3 space-y-6 my-2">
          {logs.map((log, idx) => (
            <div key={log.id || idx} className="relative pl-6">
              {/* Dot */}
              <div className="absolute -left-1.5 top-1 w-3 h-3 bg-indigo-600 rounded-full ring-4 ring-white" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{log.action}</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {log.created_at
                    ? new Date(log.created_at).toLocaleString()
                    : "Just now"}
                </span>
              </div>

              <div className="mt-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div className="flex items-center space-x-2 text-slate-500 text-[11px] mb-1">
                  <UserCheck className="w-3 h-3" />
                  <span>Actor: {log.actor_id || "System Admin"}</span>
                  {log.ip_address && (
                    <span className="font-mono">({log.ip_address})</span>
                  )}
                </div>
                {log.details && (
                  <pre className="text-[11px] font-mono bg-slate-100 p-2 rounded text-slate-800 overflow-x-auto">
                    {typeof log.details === "string"
                      ? log.details
                      : JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
