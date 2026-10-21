import React from "react";

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = "neutral",
  color = "indigo",
}) {
  const colorMap = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
  };

  const trendColorMap = {
    positive: "text-emerald-700 bg-emerald-50",
    negative: "text-rose-700 bg-rose-50",
    neutral: "text-slate-600 bg-slate-100",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        {Icon && (
          <div
            className={`p-2.5 rounded-lg border ${colorMap[color] || colorMap.indigo}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {value}
        </div>
        {trend && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
              trendColorMap[trendType] || trendColorMap.neutral
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

export default KPICard;
