import React from "react";
import { ShieldAlert, ArrowRight } from "lucide-react";

export default function QuarantineBanner({
  quarantinedCount = 0,
  quarantinedRecords = [],
}) {
  if (quarantinedCount === 0) return null;

  return (
    <div className="p-4 rounded-xl bg-[#451a03]/40 border border-[#fbbf24]/50 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#451a03] text-[#fbbf24] border border-[#fbbf24]/40">
          <ShieldAlert className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="text-sm font-bold font-mono text-[#fbbf24] flex items-center gap-2">
            <span>QUARANTINE ISOLATION ACTIVE</span>
            <span className="px-2 py-0.5 rounded text-xs bg-[#fbbf24]/20 text-[#fbbf24] font-mono font-bold">
              {quarantinedCount} Specimen{quarantinedCount > 1 ? "s" : ""}{" "}
              Isolated
            </span>
          </div>
          <p className="text-xs text-[#bac9cc] mt-0.5 font-mono">
            {quarantinedRecords
              .map((r) => `${r.species} (${r.population_count})`)
              .join(", ")}{" "}
            currently under biosecurity protocol.
          </p>
        </div>
      </div>
    </div>
  );
}
