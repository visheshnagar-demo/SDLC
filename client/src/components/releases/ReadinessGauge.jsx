import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  BarChart2,
} from "lucide-react";

export const ReadinessGauge = ({
  readiness = {
    total_items: 0,
    completed_items: 0,
    readiness_percentage: 0,
    blocker_count: 0,
    unresolved_blockers: 0,
    risk_level: "LOW",
    is_ready_for_deployment: false,
  },
}) => {
  const {
    total_items = 0,
    completed_items = 0,
    readiness_percentage = 0,
    unresolved_blockers = 0,
    risk_level = "LOW",
    is_ready_for_deployment = false,
  } = readiness || {};

  const percentage = Math.round(Number(readiness_percentage) || 0);
  const isBlocked = unresolved_blockers > 0;

  // Determine color theme
  let statusColor = "text-indigo-400";
  let strokeColor = "#6366f1";
  let bgGradient = "from-indigo-500/10 to-indigo-500/5";
  let borderColor = "border-indigo-500/20";

  if (
    isBlocked ||
    risk_level === "HIGH" ||
    risk_level === "CRITICAL" ||
    risk_level === "BLOCKER"
  ) {
    statusColor = "text-rose-400";
    strokeColor = "#f43f5e";
    bgGradient = "from-rose-500/10 to-rose-500/5";
    borderColor = "border-rose-500/20";
  } else if (percentage >= 100 || is_ready_for_deployment) {
    statusColor = "text-emerald-400";
    strokeColor = "#10b981";
    bgGradient = "from-emerald-500/10 to-emerald-500/5";
    borderColor = "border-emerald-500/20";
  } else if (percentage < 50) {
    statusColor = "text-amber-400";
    strokeColor = "#f59e0b";
    bgGradient = "from-amber-500/10 to-amber-500/5";
    borderColor = "border-amber-500/20";
  }

  // Circular gauge calculations (radius = 38, perimeter = 2 * PI * 38 ≈ 238.76)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  return (
    <div
      className={`bg-[#0f172a] rounded-xl border ${borderColor} p-5 shadow-sm bg-gradient-to-br ${bgGradient}`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Left: Gauge + Big Score */}
        <div className="flex items-center gap-5">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 100 100"
            >
              {/* Background Circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Progress Circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke={strokeColor}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`text-xl font-bold font-mono ${statusColor}`}>
                {percentage}%
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                Ready
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#dae2fd]">
                Release Readiness Score
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                  isBlocked
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    : is_ready_for_deployment || percentage >= 100
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}
              >
                Risk: {risk_level}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {isBlocked
                ? "Deployment blocked by active unresolved blocker bugs."
                : is_ready_for_deployment || percentage >= 100
                  ? "All criteria verified. Release is ready for deployment."
                  : "Development and resolution in progress."}
            </p>
          </div>
        </div>

        {/* Right: Breakdown Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full sm:w-auto">
          {/* Completed / Total Items */}
          <div className="p-3 bg-[#0b0f19] rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              Items Resolved
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-sm font-bold text-[#dae2fd]">
                {completed_items} / {total_items}
              </span>
            </div>
          </div>

          {/* Blockers */}
          <div className="p-3 bg-[#0b0f19] rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              Blockers
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <AlertTriangle
                className={`w-3.5 h-3.5 ${
                  unresolved_blockers > 0 ? "text-rose-400" : "text-slate-500"
                }`}
              />
              <span
                className={`text-sm font-bold ${
                  unresolved_blockers > 0 ? "text-rose-400" : "text-[#dae2fd]"
                }`}
              >
                {unresolved_blockers}
              </span>
            </div>
          </div>

          {/* Gate Status */}
          <div className="p-3 bg-[#0b0f19] rounded-lg border border-slate-800/80 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              Deploy Gate
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {is_ready_for_deployment && !isBlocked ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">
                    PASSED
                  </span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-xs font-bold text-rose-400">GATED</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadinessGauge;
