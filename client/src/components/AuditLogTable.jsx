import React, { useState, useEffect } from "react";
import { getAuditLogs } from "../services/api";
import {
  ShieldCheck,
  Filter,
  FileText,
  Search,
  ChevronRight,
  X,
  Layers,
  Calendar,
} from "lucide-react";

export default function AuditLogTable() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    action_type: "",
    user_id: "",
    skip: 0,
    limit: 50,
  });

  // Selected Log for Inspector Drawer
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const cleanParams = {};
      if (filters.action_type) cleanParams.action_type = filters.action_type;
      if (filters.user_id) cleanParams.user_id = filters.user_id;
      cleanParams.skip = filters.skip;
      cleanParams.limit = filters.limit;

      const data = await getAuditLogs(cleanParams);
      setLogs(data);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setError("Failed to fetch immutable audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters.action_type, filters.skip]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-cyan-400" />
            Immutable Audit Trail & Compliance Ledger
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Complete append-only log of chip creations, allocations, transfers,
            and status adjustments
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
            Filter by Action Type
          </label>
          <select
            value={filters.action_type}
            onChange={(e) =>
              setFilters({ ...filters, action_type: e.target.value })
            }
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Action Types</option>
            <option value="CREATE_CHIP">CREATE_CHIP</option>
            <option value="ADD_BATCH">ADD_BATCH</option>
            <option value="UPDATE_CHIP_STATUS">UPDATE_CHIP_STATUS</option>
            <option value="TRANSFER">TRANSFER</option>
            <option value="ALLOCATE">ALLOCATE</option>
            <option value="REDEEM">REDEEM</option>
            <option value="CREATE_ACCOUNT">CREATE_ACCOUNT</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
            Filter by Actor ID
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.user_id}
              onChange={(e) =>
                setFilters({ ...filters, user_id: e.target.value })
              }
              placeholder="Enter User / Actor ID..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="flex items-end">
          <button
            onClick={fetchLogs}
            className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-sm transition"
          >
            Apply Log Filters
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Loading audit logs...
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider bg-slate-900/60">
                  <th className="py-3 px-4">Log ID</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Actor ID</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-slate-300">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-700/30 transition">
                    <td className="py-3 px-4 font-mono text-xs text-cyan-300">
                      {log.id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 text-xs font-bold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                        {log.action_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-medium">
                      {log.entity_name} (
                      {log.entity_id ? log.entity_id.slice(0, 6) : "N/A"})
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-400">
                      {log.actor_id}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1 hover:underline"
                      >
                        Inspect Diff <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 bg-slate-900/40">
            No audit log entries match the selected filters.
          </div>
        )}
      </div>

      {/* Inspector Drawer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-end z-50">
          <div className="bg-slate-800 border-l border-slate-700 w-full max-w-lg h-full p-6 space-y-6 overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest block mb-1">
                Audit Inspector
              </span>
              <h2 className="text-xl font-bold text-white">
                Log #{selectedLog.id}
              </h2>
            </div>

            <div className="space-y-3 bg-slate-900 p-4 rounded-xl border border-slate-700 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Action Type:</span>
                <span className="font-bold text-cyan-300">
                  {selectedLog.action_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-200">
                  {new Date(selectedLog.created_at).toISOString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Actor ID:</span>
                <span className="font-mono text-slate-300">
                  {selectedLog.actor_id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Entity:</span>
                <span className="text-slate-200">
                  {selectedLog.entity_name} ({selectedLog.entity_id})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">IP Address:</span>
                <span className="font-mono text-slate-300">
                  {selectedLog.ip_address || "127.0.0.1"}
                </span>
              </div>
            </div>

            {/* Before / After State JSON */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                  State Before Change
                </h3>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300 text-xs font-mono overflow-x-auto">
                  {JSON.stringify(selectedLog.before_state ?? {}, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                  State After Change
                </h3>
                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-800 text-xs font-mono overflow-x-auto text-emerald-300">
                  {JSON.stringify(selectedLog.after_state ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
