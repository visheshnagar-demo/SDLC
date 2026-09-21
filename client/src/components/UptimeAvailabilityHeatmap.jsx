import React from "react";
import { ShieldCheck, Clock } from "lucide-react";

export default function UptimeAvailabilityHeatmap({
  uptimePercentage = 100,
  blocks = [],
  timeframe = "24h",
}) {
  // Default to 24 blocks if none provided
  const displayBlocks =
    blocks.length > 0
      ? blocks
      : Array.from({ length: 24 }, (_, i) => ({
          id: i,
          status: "Healthy",
          label: `${i}:00`,
          uptime: 100,
        }));

  const getBlockColor = (status, uptime) => {
    if (status === "Down" || uptime < 90)
      return "bg-rose-500 hover:bg-rose-400";
    if (status === "Degraded" || uptime < 99)
      return "bg-amber-500 hover:bg-amber-400";
    if (status === "Healthy" || uptime >= 99)
      return "bg-emerald-500 hover:bg-emerald-400";
    return "bg-slate-700 hover:bg-slate-600";
  };

  return (
    <div className="bg-[#0f131c] rounded-xl border border-slate-800 p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Availability &amp; Uptime Distribution ({timeframe})</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuous SLA probe verification timeline
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-mono">
            Overall Uptime:
          </span>
          <span className="text-base font-bold font-mono text-emerald-400">
            {typeof uptimePercentage === "number"
              ? uptimePercentage.toFixed(2)
              : uptimePercentage}
            %
          </span>
        </div>
      </div>

      {/* Heatmap Strip */}
      <div className="space-y-2">
        <div className="grid grid-flow-col auto-cols-fr gap-1 h-8 rounded-lg bg-[#0b0f17] p-1 border border-slate-800">
          {displayBlocks.map((block, idx) => (
            <div
              key={block.id || idx}
              title={`${block.label || `Interval ${idx + 1}`}: ${block.status || "Healthy"} (${block.uptime ?? 100}%)`}
              className={`rounded-sm transition-all cursor-pointer ${getBlockColor(block.status, block.uptime)}`}
            />
          ))}
        </div>

        {/* Legend & Labels */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
          <span>{timeframe === "30d" ? "30 days ago" : "24 hours ago"}</span>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-sm bg-emerald-500"></span>
              <span>Healthy</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-sm bg-amber-500"></span>
              <span>Degraded</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-sm bg-rose-500"></span>
              <span>Outage</span>
            </div>
          </div>
          <span>Now (100% Operational)</span>
        </div>
      </div>
    </div>
  );
}
