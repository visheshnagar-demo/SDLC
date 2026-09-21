import React from "react";
import { CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";

export default function UptimeAvailabilityHeatmap({
  timeSeriesData = [],
  uptimePct = 100,
  totalProbes = 0,
  failureCount = 0,
  timeframe = "24h",
}) {
  // Generate a clean grid of blocks based on time_series points or default slots
  const slots =
    timeSeriesData && timeSeriesData.length > 0
      ? timeSeriesData
      : Array.from({ length: timeframe === "24h" ? 24 : 30 }).map((_, i) => ({
          timestamp: `Slot ${i + 1}`,
          uptime_pct: 100,
          probe_count: 0,
          failure_count: 0,
        }));

  const getBlockColor = (slot) => {
    if (
      slot.probe_count === 0 &&
      (!slot.uptime_pct || slot.uptime_pct === 100)
    ) {
      return "bg-emerald-500/40 hover:bg-emerald-500/60 border-emerald-500/30";
    }
    const up = slot.uptime_pct !== undefined ? slot.uptime_pct : 100;
    if (up >= 99) {
      return "bg-emerald-500 hover:bg-emerald-400 border-emerald-400/50";
    }
    if (up >= 90) {
      return "bg-amber-500 hover:bg-amber-400 border-amber-400/50";
    }
    if (up > 0) {
      return "bg-rose-500 hover:bg-rose-400 border-rose-400/50";
    }
    return "bg-rose-600 hover:bg-rose-500 border-rose-500/50";
  };

  return (
    <div className="bg-[#111622] rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <span>Uptime & Availability Heatmap</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                uptimePct >= 99
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : uptimePct >= 90
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              {uptimePct.toFixed(2)}%
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Availability distribution across {timeframe} monitoring interval
          </p>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono">
          <div>
            <span className="text-slate-400">Total Probes: </span>
            <span className="text-slate-200 font-bold">{totalProbes}</span>
          </div>
          <div>
            <span className="text-slate-400">Failures: </span>
            <span
              className={
                failureCount > 0 ? "text-rose-400 font-bold" : "text-slate-400"
              }
            >
              {failureCount}
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap Blocks Strip */}
      <div className="grid grid-cols-6 sm:grid-cols-12 md:grid-cols-24 gap-1.5 py-2">
        {slots.map((slot, index) => {
          let label = slot.timestamp;
          try {
            const d = new Date(slot.timestamp);
            label = d.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
          } catch {
            label = slot.timestamp;
          }

          return (
            <div
              key={index}
              title={`${label} - ${slot.uptime_pct ?? 100}% Uptime (${slot.probe_count ?? 0} probes, ${slot.failure_count ?? 0} failures)`}
              className={`h-8 rounded-md transition-all cursor-pointer border ${getBlockColor(
                slot,
              )} flex items-center justify-center`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <span>{timeframe === "24h" ? "24 Hours Ago" : "30 Days Ago"}</span>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
            <span>&ge; 99% Uptime</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span>
            <span>90-98% Degraded</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block"></span>
            <span>&lt; 90% Outage</span>
          </div>
        </div>
        <span>Now</span>
      </div>
    </div>
  );
}
