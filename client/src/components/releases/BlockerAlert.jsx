import React from "react";
import { AlertOctagon, ArrowRight } from "lucide-react";

export const BlockerAlert = ({
  unresolvedBlockers = 0,
  blockerItems = [],
  onScrollToItems,
}) => {
  if (unresolvedBlockers <= 0 && (!blockerItems || blockerItems.length === 0)) {
    return null;
  }

  return (
    <div
      role="alert"
      className="p-4 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-pulse"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-rose-500/20 text-rose-300 rounded-lg shrink-0 mt-0.5 sm:mt-0">
          <AlertOctagon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-rose-200">
            {unresolvedBlockers} Active Blocker Bug
            {unresolvedBlockers > 1 ? "s" : ""} Gating Release
          </h4>
          <p className="text-xs text-rose-300/80 mt-0.5">
            Production deployment gate is blocked until all high-severity
            blocker defects are resolved and verified.
          </p>
          {blockerItems.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {blockerItems.map((item) => (
                <span
                  key={item.id || item.issue_key}
                  className="px-2 py-0.5 bg-rose-950/60 border border-rose-700/60 rounded text-[10px] font-mono font-bold text-rose-200"
                >
                  {item.issue_key}: {item.summary || "Blocker defect"}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {onScrollToItems && (
        <button
          onClick={onScrollToItems}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded-lg text-xs font-semibold shrink-0 transition-colors"
        >
          <span>View Blockers</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default BlockerAlert;
