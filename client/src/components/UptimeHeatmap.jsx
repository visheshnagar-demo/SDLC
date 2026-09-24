import React from "react";
import { ShieldCheck } from "lucide-react";

export const UptimeHeatmap = ({ blocks = [], uptimePercentage = 100 }) => {
  // Generate 24 default hourly blocks if empty
  const hourlyBlocks =
    blocks.length === 24
      ? blocks
      : Array.from({ length: 24 }, (_, i) => {
          const existing = blocks.find((b) => b.hour === i);
          return (
            existing || {
              hour: i,
              status: "HEALTHY",
              uptime_pct: 100,
              probe_count: 0,
            }
          );
        });

  const getBlockColor = (status) => {
    switch ((status || "").toUpperCase()) {
      case "UNHEALTHY":
        return "bg-rose-500 hover:bg-rose-400";
      case "DEGRADED":
        return "bg-amber-500 hover:bg-amber-400";
      case "HEALTHY":
        return "bg-emerald-500 hover:bg-emerald-400";
      case "NO_DATA":
      default:
        return "bg-slate-800 hover:bg-slate-700";
    }
  };

  return (
    <div
      data-testid="uptime-heatmap"
      className="bg-[#111827] border border-[#1e293b] rounded-xl p-5 shadow-xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1e293b]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-emerald-400 w-5 h-5" />
          <h3 className="font-semibold text-sm text-[#f8fafc]">
            24-Hour Availability Strip & SLA Health
          </h3>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-[#94a3b8]">Overall SLA:</span>
          <span
            className={`font-bold px-2 py-0.5 rounded ${
              uptimePercentage >= 99
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : uptimePercentage >= 95
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}
          >
            {Number(uptimePercentage || 100).toFixed(2)}% Uptime
          </span>
        </div>
      </div>

      {/* Heatmap blocks */}
      <div className="mt-5 space-y-2">
        <div className="flex gap-1.5 h-10 w-full">
          {hourlyBlocks.map((b, idx) => (
            <div
              key={idx}
              title={`Hour ${b.hour}:00 - ${b.status || "HEALTHY"} (${b.uptime_pct ?? 100}% uptime)`}
              className={`flex-1 rounded-sm transition-all cursor-pointer ${getBlockColor(
                b.status,
              )}`}
            />
          ))}
        </div>

        {/* Hour markers */}
        <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-1">
          <span>24h ago</span>
          <span>18h ago</span>
          <span>12h ago</span>
          <span>6h ago</span>
          <span>Now (UTC)</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-end gap-4 text-xs font-mono text-[#94a3b8]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
          <span>Operational (100%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
          <span>Degraded Latency</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
          <span>Outage / Error</span>
        </div>
      </div>
    </div>
  );
};

export default UptimeHeatmap;
