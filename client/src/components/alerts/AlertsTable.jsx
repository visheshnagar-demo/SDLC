import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, AlertTriangle, ShieldCheck } from "lucide-react";

export default function AlertsTable({ alerts = [], loading = false }) {
  const getSeverityBadge = (severity) => {
    switch ((severity || "").toUpperCase()) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 border border-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border border-orange-200";
      case "MEDIUM":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      case "LOW":
        return "bg-slate-100 text-slate-700 border border-slate-200";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusBadge = (status) => {
    switch ((status || "").toUpperCase()) {
      case "NEW":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "UNDER_REVIEW":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      case "ESCALATED":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      case "CONFIRMED_FRAUD":
        return "bg-rose-100 text-rose-800 border border-rose-200";
      case "DISMISSED":
        return "bg-slate-100 text-slate-600 border border-slate-200";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3"></div>
        <p className="text-sm font-medium">Loading compliance alerts...</p>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-base font-semibold text-slate-700">
          No alerts found
        </p>
        <p className="text-xs text-slate-400 mt-1">
          No suspicious transaction alerts match your current filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-700">
        <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
          <tr>
            <th className="py-3 px-4">Alert ID</th>
            <th className="py-3 px-4">Account</th>
            <th className="py-3 px-4">Transaction Details</th>
            <th className="py-3 px-4">Triggered Rules</th>
            <th className="py-3 px-4">Risk Score</th>
            <th className="py-3 px-4">Severity</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs font-normal">
          {alerts.map((alert) => {
            const shortId = alert.id
              ? alert.id.slice(0, 8).toUpperCase()
              : "N/A";
            const tx = alert.transaction || {};
            const violations = alert.violations || alert.alert_violations || [];

            return (
              <tr
                key={alert.id}
                className="hover:bg-slate-50/80 transition-colors group"
              >
                <td className="py-3.5 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                  <Link to={`/alerts/${alert.id}`} className="hover:underline">
                    ALT-{shortId}
                  </Link>
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-900 whitespace-nowrap">
                  {alert.account_id || tx.account_id || "ACC-UNKNOWN"}
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-sans font-medium text-slate-900">
                    {tx.amount !== undefined
                      ? `$${Number(tx.amount).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} ${tx.currency || "USD"}`
                      : "N/A"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {tx.merchant ? `${tx.merchant} • ` : ""}
                    {tx.location_name || "Location N/A"}
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {violations.length > 0 ? (
                      violations.map((v, idx) => (
                        <span
                          key={v.id || idx}
                          className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-[11px] font-medium border border-slate-200"
                        >
                          {v.rule_name || v.rule_type || "Rule Violation"}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">
                        No rules linked
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <span
                      className={
                        alert.risk_score >= 80
                          ? "text-red-600"
                          : alert.risk_score >= 50
                            ? "text-amber-600"
                            : "text-blue-600"
                      }
                    >
                      {alert.risk_score !== undefined ? alert.risk_score : "--"}
                    </span>
                    <span className="text-slate-400 font-normal text-[11px]">
                      / 100
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${getSeverityBadge(
                      alert.severity,
                    )}`}
                  >
                    {alert.severity || "LOW"}
                  </span>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${getStatusBadge(
                      alert.status,
                    )}`}
                  >
                    {alert.status || "NEW"}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <Link
                    to={`/alerts/${alert.id}`}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-sm transition-all"
                  >
                    <span>Investigate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
