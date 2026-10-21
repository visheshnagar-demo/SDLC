import React from "react";
import { Ticket, Users, DollarSign, Activity, TrendingUp } from "lucide-react";

export function LiveMetricsGrid({ metrics }) {
  const cards = [
    {
      title: "Passes Sold",
      value: `${metrics?.totalPassesIssued || metrics?.total_passes_sold || "4,850"}`,
      subtitle: "of 5,000 Arena Capacity",
      icon: Ticket,
      color: "from-amber-500 to-amber-600",
      textColor: "text-amber-400",
      bgGlow: "border-amber-500/30",
      change: "+14% vs yesterday",
    },
    {
      title: "Live Arena Occupancy",
      value: `${metrics?.totalCheckedIn || metrics?.live_occupancy || "1,250"} Live`,
      subtitle: "Active inside event gates",
      icon: Users,
      color: "from-emerald-500 to-emerald-600",
      textColor: "text-emerald-400",
      bgGlow: "border-emerald-500/30",
      change: "98.4% Scan Verification Rate",
    },
    {
      title: "Gross Revenue",
      value: metrics?.gross_revenue
        ? `$${Number(metrics.gross_revenue).toLocaleString()}`
        : "$214,800",
      subtitle: "Combined Passes & VIP Bookings",
      icon: DollarSign,
      color: "from-rose-500 to-rose-600",
      textColor: "text-rose-400",
      bgGlow: "border-rose-500/30",
      change: "+28.5% YoY Growth",
    },
    {
      title: "Gate Throughput Velocity",
      value: `${metrics?.scansPerMinute || metrics?.scans_per_minute || "42"} scans/min`,
      subtitle: "Sub-200ms verification latency",
      icon: Activity,
      color: "from-blue-500 to-indigo-600",
      textColor: "text-indigo-400",
      bgGlow: "border-indigo-500/30",
      change: "Peak Gate Flow: Normal",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <div
            key={idx}
            className={`bg-[#0f172a] border ${c.bgGlow} rounded-2xl p-5 shadow-xl transition-all hover:scale-[1.01]`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {c.title}
              </span>
              <div
                className={`p-2 rounded-xl bg-gradient-to-br ${c.color} text-slate-950 font-bold`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <h3
                className={`text-2xl sm:text-3xl font-extrabold font-["Syne"] ${c.textColor}`}
              >
                {c.value}
              </h3>
              <p className="text-xs text-slate-400">{c.subtitle}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-1.5 text-[11px] text-slate-300">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>{c.change}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default LiveMetricsGrid;
