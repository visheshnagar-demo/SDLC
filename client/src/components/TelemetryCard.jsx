import React from "react";

export default function TelemetryCard({
  title,
  value,
  subtext,
  icon: Icon,
  variant = "blue",
}) {
  const variantStyles = {
    emerald: {
      border: "border-emerald-800/60 bg-emerald-950/20",
      value: "text-emerald-400",
      iconBg: "bg-emerald-900/40 text-emerald-400",
    },
    blue: {
      border: "border-blue-800/60 bg-blue-950/20",
      value: "text-blue-400",
      iconBg: "bg-blue-900/40 text-blue-400",
    },
    amber: {
      border: "border-amber-800/60 bg-amber-950/20",
      value: "text-amber-400",
      iconBg: "bg-amber-900/40 text-amber-400",
    },
    red: {
      border: "border-red-800/60 bg-red-950/20",
      value: "text-red-400",
      iconBg: "bg-red-900/40 text-red-400",
    },
  };

  const style = variantStyles[variant] || variantStyles.blue;

  return (
    <div
      className={`p-4 rounded-xl border ${style.border} bg-slate-800/80 backdrop-blur shadow-lg transition-all duration-200 hover:border-slate-600`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg ${style.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className={`text-2xl font-extrabold tracking-tight ${style.value}`}>
        {value}
      </div>
      {subtext && (
        <div className="text-xs text-slate-400 mt-1 font-mono">{subtext}</div>
      )}
    </div>
  );
}
