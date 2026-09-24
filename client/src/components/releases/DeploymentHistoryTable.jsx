import React, { useState } from "react";
import Badge from "../common/Badge";
import Modal from "../common/Modal";
import {
  Rocket,
  Terminal,
  Calendar,
  User,
  PlusCircle,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

export const DeploymentHistoryTable = ({
  deployments = [],
  onOpenTriggerDeploy,
  isLoading = false,
}) => {
  const [selectedLog, setSelectedLog] = useState(null);

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#dae2fd]">
            Deployment History ({deployments.length})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological multi-environment release deployments and execution
            records.
          </p>
        </div>

        {onOpenTriggerDeploy && (
          <button
            onClick={onOpenTriggerDeploy}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Record Deployment</span>
          </button>
        )}
      </div>

      {/* Deployments List */}
      {isLoading ? (
        <div className="p-10 text-center text-slate-400">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs">Loading deployment records...</span>
        </div>
      ) : deployments.length === 0 ? (
        <div className="p-10 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Rocket className="w-8 h-8 text-slate-600" />
          <p className="text-sm font-medium text-slate-300">
            No deployment records
          </p>
          <p className="text-xs text-slate-500 max-w-sm">
            Deployments have not been executed for this release yet. Record a
            deployment once pipeline executes.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#131b2e]/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Environment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Deployed By</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Execution Logs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {deployments.map((dep) => (
                <tr
                  key={dep.id}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  {/* Environment */}
                  <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-[#dae2fd]">
                    <span className="px-2.5 py-1 bg-slate-800 rounded-md border border-slate-700 text-xs">
                      {dep.environment}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <Badge size="sm">{dep.status}</Badge>
                  </td>

                  {/* Deployed By */}
                  <td className="py-3.5 px-4 text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{dep.deployed_by || "System Automated"}</span>
                    </div>
                  </td>

                  {/* Timestamps */}
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

                  {/* Logs action */}
                  <td className="py-3.5 px-4 text-right">
                    {dep.execution_logs ? (
                      <button
                        onClick={() => setSelectedLog(dep)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono border border-slate-700 transition-colors"
                      >
                        <Terminal className="w-3 h-3 text-emerald-400" />
                        <span>View Logs</span>
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

      {/* Execution Logs Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Deployment Logs — ${selectedLog?.environment || ""}`}
        subtitle={`Status: ${selectedLog?.status || ""} | Deployed By: ${selectedLog?.deployed_by || ""}`}
        maxWidth="max-w-3xl"
      >
        <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-4 font-mono text-xs text-emerald-300 whitespace-pre-wrap overflow-x-auto max-h-[60vh] leading-relaxed">
          {selectedLog?.execution_logs || "No logs available."}
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={() => setSelectedLog(null)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default DeploymentHistoryTable;
