import React, { useState, useEffect, useCallback } from "react";
import {
  History,
  Search,
  RefreshCw,
  FileText,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import { getAuditLogs } from "../services/api";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAuditLogs({
        entity_type: entityFilter || undefined,
      });
      setLogs(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [entityFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      (log.action &&
        log.action.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.actor &&
        log.actor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.entity_id &&
        log.entity_id.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesEntity = !entityFilter || log.entity_type === entityFilter;

    return matchesSearch && matchesEntity;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Compliance &amp; System Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable chronological record of alert state changes, analyst
            decisions, and rule configuration updates.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchLogs}
            className="text-xs font-semibold underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-3 items-center justify-between bg-slate-50/50">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Action, Actor, or Entity ID..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white"
            >
              <option value="">All Entities</option>
              <option value="alert">Alerts</option>
              <option value="rule">Rules</option>
              <option value="transaction">Transactions</option>
            </select>

            <button
              onClick={fetchLogs}
              disabled={loading}
              title="Refresh Audit Logs"
              className="p-2 border border-slate-300 rounded-lg bg-white text-slate-600 hover:text-slate-900"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3"></div>
            <p className="text-sm font-medium">Loading audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">
              No audit log records found
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Actions and system changes will be automatically logged here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Entity ID</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Changes</th>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 font-mono uppercase text-slate-600">
                      {log.entity_type || "--"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-blue-700">
                      {log.entity_id ? log.entity_id.slice(0, 8) : "--"}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {log.actor || "System"}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs font-mono text-[11px] text-slate-600 truncate">
                      {log.changes ? JSON.stringify(log.changes) : "--"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {log.created_at
                        ? new Date(log.created_at).toUTCString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
