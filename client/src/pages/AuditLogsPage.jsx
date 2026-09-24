import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Badge from "../components/common/Badge";
import { getReleases, getAuditLogs } from "../services/api";
import {
  History,
  Filter,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  User,
  Clock,
} from "lucide-react";

export const AuditLogsPage = () => {
  const [releases, setReleases] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const rels = await getReleases();
      const releaseList = Array.isArray(rels) ? rels : rels.items || [];
      setReleases(releaseList);

      const logPromises = releaseList.map(async (rel) => {
        try {
          const logs = await getAuditLogs(rel.id);
          const logList = Array.isArray(logs) ? logs : logs.items || [];
          return logList.map((l) => ({
            ...l,
            release_name: rel.name,
            release_semver: rel.semver,
          }));
        } catch {
          return [];
        }
      });

      const results = await Promise.all(logPromises);
      const flattened = results.flat().sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });

      setAllLogs(flattened);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load global audit trail.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLogs = allLogs.filter((log) => {
    const matchesSearch =
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.changed_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.release_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction =
      actionFilter === "ALL" ||
      log.action?.toUpperCase().includes(actionFilter.toUpperCase());

    return matchesSearch && matchesAction;
  });

  const getActionBadgeColor = (action) => {
    const act = String(action || "").toUpperCase();
    if (act.includes("CREATE") || act.includes("LINK")) return "success";
    if (act.includes("DELETE") || act.includes("UNLINK")) return "error";
    if (act.includes("DEPLOY")) return "primary";
    if (act.includes("UPDATE") || act.includes("STATUS")) return "warning";
    return "neutral";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#dae2fd]">
            Release Audit Trail & Compliance Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable chronological audit history of all release creation,
            ticket association, deployment, and status changes.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Ledger Container */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by action, actor, or release..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0b0f19] border border-slate-700 focus:border-indigo-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#dae2fd] placeholder-slate-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              aria-label="Filter by action"
              className="bg-[#0b0f19] border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:border-indigo-500"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">Creation Events</option>
              <option value="LINK">Link Events</option>
              <option value="UPDATE">Update Events</option>
              <option value="DEPLOY">Deployment Events</option>
              <option value="DELETE">Delete / Unlink Events</option>
            </select>
          </div>
        </div>

        {/* Audit List */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs">Loading compliance audit trail...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <History className="w-8 h-8 text-slate-600" />
            <p className="text-sm font-medium text-slate-300">
              No audit events found
            </p>
            <p className="text-xs text-slate-500">
              Audit trails are recorded automatically upon any state change.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredLogs.map((log) => {
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
                          onClick={() =>
                            setExpandedLogId(isExpanded ? null : log.id)
                          }
                          className="text-slate-500 hover:text-slate-300 p-0.5"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <Badge
                        variant={getActionBadgeColor(log.action)}
                        size="sm"
                      >
                        {log.action}
                      </Badge>
                      <Link
                        to={`/releases/${log.release_id}`}
                        className="text-xs font-semibold text-indigo-300 hover:underline"
                      >
                        {log.release_name || "Release"} (
                        {log.release_semver || "v"})
                      </Link>
                      <span className="text-xs text-slate-400 font-mono">
                        · {log.entity_type}
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
                            ? new Date(log.created_at).toLocaleString(
                                undefined,
                                {
                                  dateStyle: "short",
                                  timeStyle: "medium",
                                },
                              )
                            : "Recently"}
                        </span>
                      </div>
                    </div>
                  </div>

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
    </div>
  );
};

export default AuditLogsPage;
