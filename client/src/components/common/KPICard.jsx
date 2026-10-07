import React from "react";

export const KPICard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  color = "sky",
}) => {
  const colorMap = {
    sky: "bg-sky-50 text-sky-600 border-sky-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };

  const iconStyle = colorMap[color] || colorMap.sky;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        {trendLabel && (
          <div className="flex items-center gap-1 mt-2 text-xs">
            <span
              className={`font-semibold ${
                trend === "up"
                  ? "text-emerald-600"
                  : trend === "down"
                    ? "text-rose-600"
                    : "text-slate-600"
              }`}
            >
              {trendLabel}
            </span>
            <span className="text-slate-400">vs last period</span>
          </div>
        )}
      </div>
      {Icon && (
        <div className={`p-3 rounded-lg border ${iconStyle}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
};

export default KPICard;
