import React from "react";
import { AlertCircle, ShieldAlert, Clock, CheckCircle2 } from "lucide-react";

export default function KpiMetricGroup({ alerts = [], loading = false }) {
  const totalOpen = alerts.filter(
    (a) =>
      a.status === "NEW" ||
      a.status === "UNDER_REVIEW" ||
      a.status === "ESCALATED",
  ).length;

  const criticalCount = alerts.filter(
    (a) => (a.severity || "").toUpperCase() === "CRITICAL",
  ).length;

  const underReviewCount = alerts.filter(
    (a) => a.status === "UNDER_REVIEW",
  ).length;

  const confirmedFraudCount = alerts.filter(
    (a) => a.status === "CONFIRMED_FRAUD",
  ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Open Alerts
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {loading ? "..." : totalOpen}
          </p>
          <span className="text-xs text-blue-600 font-medium">
            Active investigations
          </span>
        </div>
        <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
          <AlertCircle className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Critical Severity
          </p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {loading ? "..." : criticalCount}
          </p>
          <span className="text-xs text-red-600 font-medium">
            Immediate Action Required
          </span>
        </div>
        <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
          <ShieldAlert className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Under Review
          </p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {loading ? "..." : underReviewCount}
          </p>
          <span className="text-xs text-slate-500 font-medium">
            In analyst triage
          </span>
        </div>
        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Confirmed Fraud
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {loading ? "..." : confirmedFraudCount}
          </p>
          <span className="text-xs text-emerald-600 font-medium">
            Verified fraud incidents
          </span>
        </div>
        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
