import React from "react";
import {
  Ticket,
  Users,
  DollarSign,
  Activity,
  Zap,
  TrendingUp,
} from "lucide-react";

export const LiveMetricsGrid = ({ analytics }) => {
  const passesIssued = analytics?.totalPassesIssued ?? 0;
  const checkedIn = analytics?.totalCheckedIn ?? 0;
  const scansPerMin = analytics?.scansPerMinute ?? 0;
  const grossRevenue = analytics?.grossRevenue ?? 0;
  const occupancyRate =
    passesIssued > 0
      ? Math.min(100, Math.round((checkedIn / passesIssued) * 100))
      : 0;

  const cards = [
    {
      title: "Passes Issued",
      value: Number(passesIssued).toLocaleString(),
      subtext: "Across all Garba categories",
      icon: Ticket,
      color: "from-[#F59E0B] to-[#FBBF24]",
      textColor: "text-[#F59E0B]",
      bgColor: "bg-[#F59E0B]/10",
      borderColor: "border-[#F59E0B]/20",
    },
    {
      title: "Live Arena Occupancy",
      value: `${Number(checkedIn).toLocaleString()}`,
      subtext: `${occupancyRate}% of issued passes inside venue`,
      icon: Users,
      color: "from-emerald-500 to-teal-400",
      textColor: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      badge: "LIVE",
    },
    {
      title: "Gross Revenue",
      value: `$${Number(grossRevenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtext: "Ticket sales & registration dues",
      icon: DollarSign,
      color: "from-[#BE185D] to-rose-400",
      textColor: "text-[#F43F5E]",
      bgColor: "bg-[#BE185D]/10",
      borderColor: "border-[#BE185D]/20",
    },
    {
      title: "Scan Velocity",
      value: `${Number(scansPerMin).toFixed(1)}/min`,
      subtext: "Real-time entry gate throughput",
      icon: Zap,
      color: "from-blue-500 to-indigo-400",
      textColor: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className={`bg-[#0F172A] border ${card.borderColor} rounded-2xl p-5 shadow-xl transition-all duration-200 hover:scale-[1.01]`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">
                {card.title}
              </span>
              <div
                className={`w-8 h-8 rounded-xl ${card.bgColor} flex items-center justify-center ${card.textColor}`}
              >
                <IconComponent className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <h3
                className={`text-2xl sm:text-3xl font-extrabold font-display ${card.textColor}`}
              >
                {card.value}
              </h3>
              {card.badge && (
                <span className="animate-pulse bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {card.badge}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-1">{card.subtext}</p>
          </div>
        );
      })}
    </div>
  );
};

export default LiveMetricsGrid;
