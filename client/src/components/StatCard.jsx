import React from "react";

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  colorScheme = "blue",
}) => {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div
            className={`p-2 rounded-lg border ${colorMap[colorScheme] || colorMap.blue}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            {trend && (
              <span
                className={`font-semibold px-1.5 py-0.5 rounded text-[11px] ${
                  trendPositive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {trend}
              </span>
            )}
            {subtitle && <span className="text-slate-500">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
