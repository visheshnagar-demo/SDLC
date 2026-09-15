import React, { useState } from "react";
import { History, Search, Code, Clock, User, Info } from "lucide-react";

export default function AuditLogViewer({ auditLogs = [], loading = false }) {
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  const filteredLogs = auditLogs.filter((log) => {
    const term = search.toLowerCase();
    return (
      log.action?.toLowerCase().includes(term) ||
      log.entity_type?.toLowerCase().includes(term) ||
      log.actor_id?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Write-Once Immutable Audit Log
            </h2>
            <p className="text-xs text-slate-400">
              Compliance trail of administrative and security events
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Filter logs by action/entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-medium text-xs uppercase tracking-wider">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Entity Type</th>
              <th className="py-3 px-4">Actor ID</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
            {loading ? (
              <tr>
                <td
                  colSpan="5"
                  className="py-6 text-center text-slate-400 font-sans"
                >
                  Loading audit log trail...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="py-8 text-center text-slate-400 font-sans"
                >
                  No audit log entries recorded.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-semibold text-indigo-300">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {log.entity_type}
                  </td>
                  <td className="py-3 px-4 text-slate-400 truncate max-w-[120px]">
                    {log.actor_id || "System"}
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 inline-flex items-center gap-1"
                    >
                      <Code className="w-3 h-3 text-indigo-400" />
                      View JSON
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-400" />
                Audit Record Payload Inspection
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 bg-slate-800 rounded"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 mb-4 text-xs font-mono text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500">Log ID:</span> {selectedLog.id}
              </div>
              <div>
                <span className="text-slate-500">Tenant ID:</span>{" "}
                {selectedLog.tenant_id}
              </div>
              <div>
                <span className="text-slate-500">Timestamp:</span>{" "}
                {selectedLog.created_at}
              </div>
              <div>
                <span className="text-slate-500">Action:</span>{" "}
                {selectedLog.action}
              </div>
            </div>

            <label className="block text-xs font-medium text-slate-400 mb-1">
              Payload Details (JSON):
            </label>
            <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-60">
              {JSON.stringify(selectedLog.details || {}, null, 2)}
            </pre>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
