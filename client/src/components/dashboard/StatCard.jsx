import React from "react";

export function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  status = "info",
  description,
  progress,
}) {
  const statusColors = {
    info: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    error: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  const badgeColor = statusColors[status] || statusColors.info;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline space-x-1.5 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {value}
            </span>
            {unit && (
              <span className="text-sm font-medium text-slate-400">{unit}</span>
            )}
          </div>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${badgeColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {progress !== undefined && (
        <div className="mt-4">
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                progress >= 98
                  ? "bg-rose-500"
                  : progress <= 10
                    ? "bg-amber-500"
                    : "bg-sky-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {(trend || description) && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          {description && <span>{description}</span>}
          {trend && (
            <span
              className={`font-semibold ${trend.startsWith("+") ? "text-emerald-400" : "text-slate-300"}`}
            >
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default StatCard;
