import React from "react";
import { Layers, Activity, CheckCircle2, AlertOctagon } from "lucide-react";

export const MetricCards = ({
  totalReleases = 0,
  activeReleases = 0,
  avgReadiness = 0,
  unresolvedBlockers = 0,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Releases */}
      <div className="p-5 bg-[#0f172a] rounded-xl border border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Releases
          </h4>
          <p className="text-2xl font-bold text-[#dae2fd] mt-1">
            {totalReleases}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Across all project milestones
          </span>
        </div>
        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
          <Layers className="w-6 h-6" />
        </div>
      </div>

      {/* Active Releases */}
      <div className="p-5 bg-[#0f172a] rounded-xl border border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Active Releases
          </h4>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {activeReleases}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Currently in progress / open
          </span>
        </div>
        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
          <Activity className="w-6 h-6" />
        </div>
      </div>

      {/* Avg Readiness */}
      <div className="p-5 bg-[#0f172a] rounded-xl border border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Avg Readiness
          </h4>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {Number(avgReadiness).toFixed(1)}%
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Aggregated item resolution
          </span>
        </div>
        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-6 h-6" />
        </div>
      </div>

      {/* Unresolved Blockers */}
      <div className="p-5 bg-[#0f172a] rounded-xl border border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Unresolved Blockers
          </h4>
          <p className="text-2xl font-bold text-rose-400 mt-1">
            {unresolvedBlockers}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {unresolvedBlockers > 0
              ? "Action required before deployment"
              : "Zero blocking defects"}
          </span>
        </div>
        <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
          <AlertOctagon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default MetricCards;
