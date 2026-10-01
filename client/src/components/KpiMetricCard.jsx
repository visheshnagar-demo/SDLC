import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function KpiMetricCard({
  title,
  value,
  change,
  trend = "up", // 'up' | 'down' | 'neutral'
  badgeText,
  badgeVariant = "default", // 'success' | 'warning' | 'info' | 'purple' | 'danger'
  icon: Icon,
  description,
}) {
  const getBadgeClasses = (variant) => {
    switch (variant) {
      case "success":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "warning":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "danger":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "purple":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "info":
      default:
        return "bg-sky-50 text-sky-700 border-sky-200";
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="h-9 w-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </span>
        </div>

        {badgeText && (
          <span
            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getBadgeClasses(
              badgeVariant,
            )}`}
          >
            {badgeText}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </span>

        {change && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold ${
              trend === "up"
                ? "text-emerald-600"
                : trend === "down"
                  ? "text-rose-600"
                  : "text-slate-500"
            }`}
          >
            {trend === "up" && <TrendingUp className="h-3.5 w-3.5" />}
            {trend === "down" && <TrendingDown className="h-3.5 w-3.5" />}
            {trend === "neutral" && <Minus className="h-3.5 w-3.5" />}
            <span>{change}</span>
          </div>
        )}
      </div>

      {description && (
        <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">
          {description}
        </p>
      )}
    </div>
  );
}
