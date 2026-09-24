import React from "react";
import { History, ShieldCheck, UserCheck, AlertCircle } from "lucide-react";

export default function AuditTrailTimeline({ auditLogs = [] }) {
  const getActionIcon = (action) => {
    if (action.includes("STATUS") || action.includes("UPDATE")) {
      return <UserCheck className="w-3.5 h-3.5 text-blue-600" />;
    }
    if (
      action.includes("TRIGGER") ||
      action.includes("BREACH") ||
      action.includes("ALERT")
    ) {
      return <AlertCircle className="w-3.5 h-3.5 text-red-600" />;
    }
    return <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />;
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
        <History className="w-4 h-4 text-blue-700" />
        <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
          Audit Trail &amp; Decision History
        </h2>
      </div>

      {auditLogs.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-2">
          No audit log entries recorded for this alert yet.
        </p>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {auditLogs.map((log, index) => {
            const timestamp = log.created_at
              ? new Date(log.created_at).toUTCString()
              : "Just now";
            return (
              <div key={log.id || index} className="relative group">
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center">
                  {getActionIcon(log.action || "")}
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      {log.action || "SYSTEM_EVENT"}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {timestamp}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    <span className="font-medium">Actor:</span>{" "}
                    {log.actor || "Automated Rule Engine"}
                  </p>
                  {log.changes && Object.keys(log.changes).length > 0 && (
                    <div className="mt-1 p-2 bg-white rounded border border-slate-100 font-mono text-[11px] text-slate-600 overflow-x-auto">
                      {JSON.stringify(log.changes, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
