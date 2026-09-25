import React from "react";
import { AlertOctagon, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function AlertBanner({ alerts = [] }) {
  const activeAlerts = alerts.filter(
    (a) =>
      a.status?.toUpperCase() === "ACTIVE" ||
      a.status?.toUpperCase() === "TRIGGERED",
  );

  if (activeAlerts.length === 0) return null;

  const criticalCount = activeAlerts.filter(
    (a) => a.severity?.toUpperCase() === "CRITICAL",
  ).length;
  const warningCount = activeAlerts.filter(
    (a) => a.severity?.toUpperCase() === "WARNING",
  ).length;

  return (
    <div className="p-4 rounded-xl bg-[#4c0519]/40 border border-[#fb7185]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-[#fb7185]/10 animate-fade-in">
      <div className="flex items-start sm:items-center gap-3">
        <div className="p-2 rounded-lg bg-[#4c0519] text-[#fb7185] border border-[#fb7185]/40 flex-shrink-0">
          {criticalCount > 0 ? (
            <AlertOctagon className="w-5 h-5 animate-pulse" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
        </div>
        <div>
          <div className="text-sm font-bold font-mono text-[#ffb4ab] flex items-center gap-2">
            <span>PARAMETER SAFETY THRESHOLD BREACH DETECTED</span>
            <span className="px-2 py-0.5 rounded text-[11px] bg-[#4c0519] text-[#fb7185] font-mono">
              {activeAlerts.length} Active
            </span>
          </div>
          <p className="text-xs text-[#dbe3f3] mt-0.5 font-mono">
            {criticalCount > 0 && `${criticalCount} Critical condition(s) `}
            {warningCount > 0 && `${warningCount} Warning limit(s) `}
            require caretaker intervention.
          </p>
        </div>
      </div>

      <Link
        to="/alerts"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#fb7185] hover:bg-[#fb7185]/90 text-[#070c13] text-xs font-bold font-mono transition-colors self-start sm:self-auto flex-shrink-0"
      >
        <span>Triage in Alert Center</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
