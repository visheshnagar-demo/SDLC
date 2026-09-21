import React from "react";
import {
  Droplets,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";

export function TankGaugeCard({ tank, onSelect }) {
  const {
    name,
    location,
    total_capacity_liters,
    current_volume_liters,
    status,
    net_flow_rate_lpm,
  } = tank;
  const fillPct = Math.round(
    (current_volume_liters / total_capacity_liters) * 100,
  );

  let statusBadge = {
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    label: "Optimal",
  };
  if (fillPct >= 98 || status === "OVERFLOW_WARNING") {
    statusBadge = {
      color: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      label: "Overflow Warning (>98%)",
    };
  } else if (fillPct <= 10 || status === "LOW_LEVEL_WARNING") {
    statusBadge = {
      color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      label: "Low Level (<10%)",
    };
  }

  return (
    <div
      className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-xl p-5 shadow-sm transition-all cursor-pointer flex flex-col justify-between"
      onClick={() => onSelect && onSelect(tank)}
    >
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-white">{name}</h3>
            <p className="text-xs text-slate-400">{location}</p>
          </div>
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusBadge.color}`}
          >
            {statusBadge.label}
          </span>
        </div>

        {/* Tank Fluid Gauge Visual */}
        <div className="my-5 flex items-center space-x-6">
          <div className="relative w-16 h-32 bg-slate-800 rounded-2xl border-2 border-slate-700 overflow-hidden shadow-inner flex flex-col justify-end">
            <div
              className={`w-full transition-all duration-700 ${
                fillPct >= 98
                  ? "bg-rose-500"
                  : fillPct <= 10
                    ? "bg-amber-500"
                    : "bg-gradient-to-t from-sky-600 to-cyan-400"
              }`}
              style={{ height: `${fillPct}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-black text-white drop-shadow-md bg-slate-950/60 px-1.5 py-0.5 rounded">
                {fillPct}%
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-2 text-xs">
            <div>
              <span className="text-slate-400">Current Volume:</span>
              <p className="text-lg font-bold text-white font-mono">
                {current_volume_liters.toLocaleString()}{" "}
                <span className="text-xs text-slate-400">
                  / {total_capacity_liters.toLocaleString()} L
                </span>
              </p>
            </div>

            <div>
              <span className="text-slate-400">Net Intake/Outflow Rate:</span>
              <div className="flex items-center space-x-1 font-semibold">
                {net_flow_rate_lpm >= 0 ? (
                  <>
                    <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-mono">
                      +{net_flow_rate_lpm} L/min
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-400 font-mono">
                      {net_flow_rate_lpm} L/min
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-sky-400 font-medium">
        <span>Inspect Telemetry</span>
        <Droplets className="w-4 h-4" />
      </div>
    </div>
  );
}

export default TankGaugeCard;
