import React from "react";

export default function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  color = "blue",
  trend,
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    emerald:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    amber:
      "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400",
    purple:
      "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  };

  return (
    <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
          {value !== undefined && value !== null ? value : "--"}
        </h3>
        {subtext && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            {trend && (
              <span
                className={
                  trend.positive ? "text-emerald-600" : "text-rose-600"
                }
              >
                {trend.positive ? "↑" : "↓"} {trend.label}
              </span>
            )}
            <span>{subtext}</span>
          </p>
        )}
      </div>
      {Icon && (
        <div className={`p-3 rounded-lg ${colorMap[color] || colorMap.blue}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
}
