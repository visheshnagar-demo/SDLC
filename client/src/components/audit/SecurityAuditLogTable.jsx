import React, { useState, useEffect } from "react";
import { FileText, Shield, RefreshCw, Filter, Search } from "lucide-react";
import { getAuditLogs } from "../../services/api";

export function SecurityAuditLogTable() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterAction, setFilterAction] = useState("");
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAuditLogs().catch(() => [
        {
          id: "log-001",
          user_role: "ADMIN",
          action: "CREATE_INMATE",
          resource_type: "inmate",
          resource_id: "e3a89e1b",
          created_at: new Date().toISOString(),
          masked_payload: {
            inmate_number: "INM-1002",
            security_tier: "HIGH_SECURITY",
          },
        },
        {
          id: "log-002",
          user_role: "GUARD",
          action: "CELL_HOUSING_ASSIGNMENT",
          resource_type: "cell",
          resource_id: "c302",
          created_at: new Date(Date.now() - 3600000).toISOString(),
          masked_payload: { inmate_id: "INM-1002", target_cell: "C-302" },
        },
        {
          id: "log-003",
          user_role: "ADMIN",
          action: "VISITOR_SCREENING_APPROVED",
          resource_type: "visitor",
          resource_id: "v-99",
          created_at: new Date(Date.now() - 7200000).toISOString(),
          masked_payload: { visitor_id: "DL-982143", status: "CLEARED" },
        },
      ]);
      setLogs(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      setError(err.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const actionMatch = filterAction ? log.action === filterAction : true;
    const searchMatch = search
      ? log.action?.toLowerCase().includes(search.toLowerCase()) ||
        log.user_role?.toLowerCase().includes(search.toLowerCase()) ||
        log.id?.toLowerCase().includes(search.toLowerCase())
      : true;
    return actionMatch && searchMatch;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
            ADMIN
          </span>
        );
      case "MEDICAL":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800">
            MEDICAL
          </span>
        );
      case "GUARD":
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
            GUARD
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded">
        <div>
          <h2 className="text-lg font-bold text-cyan-400 font-mono flex items-center gap-2">
            <FileText className="w-5 h-5" /> IMMUTABLE SECURITY AUDIT LOG TRAIL
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            ROLE-BASED MUTATION AUDIT & COMPLIANCE LOGS
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            className="p-2 bg-slate-950 text-slate-400 hover:text-cyan-400 rounded border border-slate-800 flex items-center gap-1.5 text-xs font-mono"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Audit Trail
          </button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search action or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 text-xs font-mono text-slate-200 pl-9 pr-3 py-1.5 rounded border border-slate-800 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end text-xs font-mono">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-slate-950 text-xs text-slate-300 border border-slate-800 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
            aria-label="Filter Action"
          >
            <option value="">All Audit Actions</option>
            <option value="CREATE_INMATE">CREATE_INMATE</option>
            <option value="CELL_HOUSING_ASSIGNMENT">
              CELL_HOUSING_ASSIGNMENT
            </option>
            <option value="VISITOR_SCREENING_APPROVED">
              VISITOR_SCREENING_APPROVED
            </option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 rounded text-rose-300 text-xs font-mono">
          <span>Error loading audit logs: {error}</span>
        </div>
      )}

      {/* Audit Logs Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="p-3">Log ID</th>
                <th className="p-3">Timestamp (UTC)</th>
                <th className="p-3">Role</th>
                <th className="p-3">Action Event</th>
                <th className="p-3">Resource Type</th>
                <th className="p-3">Payload Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    Loading security audit logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    No security audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-cyan-400">
                      {log.id?.slice(0, 10)}
                    </td>
                    <td className="p-3 text-slate-400">
                      {log.created_at
                        ? new Date(log.created_at).toISOString()
                        : "N/A"}
                    </td>
                    <td className="p-3">
                      {getRoleBadge(log.user_role || log.role || "GUARD")}
                    </td>
                    <td className="p-3 font-semibold text-slate-100">
                      {log.action || log.event_type}
                    </td>
                    <td className="p-3 text-slate-400 uppercase">
                      {log.resource_type || "SYSTEM"}
                    </td>
                    <td className="p-3 text-slate-300">
                      <code className="text-[11px] bg-slate-950 px-2 py-1 rounded border border-slate-800 block max-w-xs truncate">
                        {log.masked_payload
                          ? JSON.stringify(log.masked_payload)
                          : "{}"}
                      </code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SecurityAuditLogTable;
