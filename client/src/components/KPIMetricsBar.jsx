import React from "react";
import {
  Users,
  LogIn,
  Clock,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

export default function KPIMetricsBar({ visits = [], total = 0 }) {
  // Compute metrics from visits dataset
  const onSiteCount = visits.filter((v) => v.status === "CHECKED_IN").length;
  const pendingCount = visits.filter(
    (v) => v.status === "PENDING_APPROVAL",
  ).length;
  const completedCount = visits.filter(
    (v) => v.status === "CHECKED_OUT",
  ).length;
  const approvedCount = visits.filter((v) => v.status === "APPROVED").length;

  const cards = [
    {
      title: "Total Visits Logged",
      value: total || visits.length,
      icon: Users,
      color: "indigo",
      badge: "All-Time",
    },
    {
      title: "Currently On-Premises",
      value: onSiteCount,
      icon: LogIn,
      color: "emerald",
      badge: "Active Badges",
    },
    {
      title: "Pending Host Review",
      value: pendingCount,
      icon: Clock,
      color: "amber",
      badge: "Action Required",
    },
    {
      title: "Completed Departures",
      value: completedCount,
      icon: CheckCircle2,
      color: "blue",
      badge: "Archived",
    },
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case "emerald":
        return {
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          border: "border-emerald-200",
          iconBg: "bg-emerald-500/10 text-emerald-600",
        };
      case "amber":
        return {
          bg: "bg-amber-50",
          text: "text-amber-700",
          border: "border-amber-200",
          iconBg: "bg-amber-500/10 text-amber-600",
        };
      case "blue":
        return {
          bg: "bg-blue-50",
          text: "text-blue-700",
          border: "border-blue-200",
          iconBg: "bg-blue-500/10 text-blue-600",
        };
      case "indigo":
      default:
        return {
          bg: "bg-indigo-50",
          text: "text-indigo-700",
          border: "border-indigo-200",
          iconBg: "bg-indigo-500/10 text-indigo-600",
        };
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const style = getColorClasses(card.color);
        return (
          <div
            key={card.title}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between"
          >
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {card.title}
              </span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {card.value}
              </div>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold ${style.bg} ${style.text}`}
              >
                {card.badge}
              </span>
            </div>

            <div className={`p-3 rounded-xl ${style.iconBg} flex-shrink-0`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
