import React from "react";

export function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  badgeText,
  badgeColor = "emerald",
}) {
  const colorMap = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };

  const iconBgMap = {
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    red: "bg-rose-100 text-rose-600",
    indigo: "bg-indigo-100 text-indigo-600",
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
            {value}
          </div>
        </div>
        {Icon && (
          <div
            className={`p-3 rounded-lg flex items-center justify-center ${
              iconBgMap[badgeColor] || iconBgMap.emerald
            }`}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        {subtext && <span className="text-slate-500">{subtext}</span>}
        {badgeText && (
          <span
            className={`px-2 py-0.5 rounded-full font-medium border ${
              colorMap[badgeColor] || colorMap.emerald
            }`}
          >
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}

export default StatCard;
