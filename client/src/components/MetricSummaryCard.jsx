import React from "react";

export default function MetricSummaryCard({
  title,
  value,
  unit = "",
  subtext,
  icon: Icon,
  variant = "default", // 'default' | 'success' | 'warning' | 'danger'
  trendText,
  trendPositive = true,
}) {
  const variantStyles = {
    default: {
      border: "border-slate-800",
      iconBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      glow: "group-hover:border-cyan-500/30",
      valueColor: "text-slate-100",
    },
    success: {
      border: "border-slate-800",
      iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      glow: "group-hover:border-emerald-500/30",
      valueColor: "text-emerald-400",
    },
    warning: {
      border: "border-slate-800",
      iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      glow: "group-hover:border-amber-500/30",
      valueColor: "text-amber-400",
    },
    danger: {
      border: "border-slate-800",
      iconBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      glow: "group-hover:border-rose-500/30",
      valueColor: "text-rose-400",
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div
      className={`group bg-[#111622] rounded-xl border ${style.border} ${style.glow} p-5 transition-all duration-200 shadow-lg hover:shadow-cyan-950/10`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg border ${style.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-1.5">
        <span
          className={`text-2xl sm:text-3xl font-bold font-mono ${style.valueColor}`}
        >
          {value !== undefined && value !== null ? value : "--"}
        </span>
        {unit && (
          <span className="text-sm font-medium text-slate-400">{unit}</span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        {subtext && <span className="text-slate-400">{subtext}</span>}
        {trendText && (
          <span
            className={`font-medium ${
              trendPositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {trendText}
          </span>
        )}
      </div>
    </div>
  );
}
