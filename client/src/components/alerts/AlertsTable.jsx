import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Clock,
  Check,
} from "lucide-react";

export function AlertsTable({ alerts = [], onAcknowledgeAlert }) {
  const [filter, setFilter] = useState("ALL");
  const [acknowledgingId, setAcknowledgingId] = useState(null);
  const [error, setError] = useState(null);

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "UNACKNOWLEDGED") return !alert.is_acknowledged;
    if (filter === "HIGH") return alert.severity === "HIGH";
    return true;
  });

  const handleAcknowledge = async (alertId) => {
    setAcknowledgingId(alertId);
    setError(null);
    try {
      if (onAcknowledgeAlert) {
        await onAcknowledgeAlert(alertId);
      }
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to acknowledge alert");
    } finally {
      setAcknowledgingId(null);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "HIGH":
      case "CRITICAL":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "MEDIUM":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      default:
        return "bg-sky-500/10 text-sky-400 border-sky-500/30";
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm space-y-0">
      {/* Header controls */}
      <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              System Alerts & Maintenance Tickets
            </h3>
            <p className="text-xs text-slate-400">
              Automated filter replacement reminders, pump runtime limits, and
              overflow warnings.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filter === "ALL"
                ? "bg-sky-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setFilter("UNACKNOWLEDGED")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filter === "UNACKNOWLEDGED"
                ? "bg-sky-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Active ({alerts.filter((a) => !a.is_acknowledged).length})
          </button>
          <button
            onClick={() => setFilter("HIGH")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              filter === "HIGH"
                ? "bg-sky-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            High Priority ({alerts.filter((a) => a.severity === "HIGH").length})
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 sm:px-6">Severity & Category</th>
              <th className="py-3 px-4 sm:px-6">Message / Description</th>
              <th className="py-3 px-4 sm:px-6">Logged Time</th>
              <th className="py-3 px-4 sm:px-6">State</th>
              <th className="py-3 px-4 sm:px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-slate-500">
                  No alerts found matching selected filter.
                </td>
              </tr>
            ) : (
              filteredAlerts.map((alert) => (
                <tr
                  key={alert.id}
                  className="hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getSeverityBadge(
                          alert.severity,
                        )}`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        [{alert.category}]
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 sm:px-6 font-medium text-white max-w-md">
                    {alert.message}
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-xs text-slate-400 font-mono">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {new Date(alert.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 sm:px-6">
                    {alert.is_acknowledged ? (
                      <span className="inline-flex items-center space-x-1 text-xs text-emerald-400 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Acknowledged</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-xs text-amber-400 font-semibold">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Pending Action</span>
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-right">
                    {!alert.is_acknowledged && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={acknowledgingId === alert.id}
                        className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          {acknowledgingId === alert.id
                            ? "Saving..."
                            : "Acknowledge"}
                        </span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AlertsTable;
