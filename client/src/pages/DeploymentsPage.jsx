import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import { getReleases, getDeployments } from "../services/api";
import {
  Rocket,
  Terminal,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
  Search,
  RefreshCw,
  AlertCircle,
  Server,
} from "lucide-react";

export const DeploymentsPage = () => {
  const [releases, setReleases] = useState([]);
  const [allDeployments, setAllDeployments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [envFilter, setEnvFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const rels = await getReleases();
      const releaseList = Array.isArray(rels) ? rels : rels.items || [];
      setReleases(releaseList);

      // Fetch deployments for each release
      const deploymentPromises = releaseList.map(async (rel) => {
        try {
          const deps = await getDeployments(rel.id);
          const depList = Array.isArray(deps) ? deps : deps.items || [];
          return depList.map((d) => ({
            ...d,
            release_name: rel.name,
            release_semver: rel.semver,
          }));
        } catch {
          return [];
        }
      });

      const results = await Promise.all(deploymentPromises);
      const flattened = results.flat().sort((a, b) => {
        const dateA = new Date(a.started_at || a.created_at || 0);
        const dateB = new Date(b.started_at || b.created_at || 0);
        return dateB - dateA;
      });

      setAllDeployments(flattened);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load deployment history.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredDeployments = allDeployments.filter((dep) => {
    const matchesEnv =
      envFilter === "ALL" ||
      dep.environment?.toUpperCase() === envFilter.toUpperCase();
    const matchesStatus =
      statusFilter === "ALL" ||
      dep.status?.toUpperCase() === statusFilter.toUpperCase();
    return matchesEnv && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#dae2fd]">
            Deployment Operations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global view of deployment executions, environment rollouts, and
            pipeline audit logs.
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

      {/* Deployments Table Container */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-sm overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="font-semibold uppercase tracking-wide">
              Filter by:
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              aria-label="Filter by environment"
              className="bg-[#0b0f19] border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:border-indigo-500"
            >
              <option value="ALL">All Environments</option>
              <option value="DEVELOPMENT">Development</option>
              <option value="QA">QA</option>
              <option value="STAGING">Staging</option>
              <option value="PRODUCTION">Production</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="bg-[#0b0f19] border border-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-xs focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="IN PROGRESS">In Progress</option>
              <option value="FAILED">Failed</option>
              <option value="ROLLED BACK">Rolled Back</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs">Loading all deployments...</span>
          </div>
        ) : filteredDeployments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Rocket className="w-8 h-8 text-slate-600" />
            <p className="text-sm font-medium text-slate-300">
              No deployments recorded
            </p>
            <p className="text-xs text-slate-500">
              No deployment operations have been logged across releases yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-[#131b2e]/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-6">Release</th>
                  <th className="py-3 px-4">Environment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-right">Logs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredDeployments.map((dep) => (
                  <tr
                    key={dep.id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/releases/${dep.release_id}`}
                          className="font-semibold text-[#dae2fd] hover:text-indigo-400"
                        >
                          {dep.release_name || "Release"}
                        </Link>
                        {dep.release_semver && (
                          <span className="px-1.5 py-0.5 bg-indigo-500/20 text-[#c0c1ff] font-mono text-[10px] rounded border border-indigo-500/30">
                            {dep.release_semver}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium">
                      <span className="px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-xs text-slate-200">
                        {dep.environment}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge size="sm">{dep.status}</Badge>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      {dep.deployed_by || "System"}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {dep.started_at || dep.created_at
                            ? new Date(
                                dep.started_at || dep.created_at,
                              ).toLocaleString(undefined, {
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : "Recently"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {dep.execution_logs ? (
                        <button
                          onClick={() => setSelectedLog(dep)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono border border-slate-700 transition-colors"
                        >
                          <Terminal className="w-3 h-3 text-emerald-400" />
                          <span>Logs</span>
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[11px]">
                          No logs
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Logs Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Deployment Output — ${selectedLog?.release_name || ""} (${selectedLog?.environment || ""})`}
        subtitle={`Status: ${selectedLog?.status || ""} | Deployed By: ${selectedLog?.deployed_by || ""}`}
        maxWidth="max-w-3xl"
      >
        <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-4 font-mono text-xs text-emerald-300 whitespace-pre-wrap overflow-x-auto max-h-[60vh] leading-relaxed">
          {selectedLog?.execution_logs || "No logs available."}
        </div>
      </Modal>
    </div>
  );
};

export default DeploymentsPage;
