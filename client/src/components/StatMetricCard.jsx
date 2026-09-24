import React from "react";

export const StatMetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  variant = "default",
  loading = false,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          accent: "hover:border-emerald-500/40",
        };
      case "warning":
        return {
          iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          accent: "hover:border-amber-500/40",
        };
      case "danger":
        return {
          iconBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          accent: "hover:border-rose-500/40",
        };
      case "info":
      default:
        return {
          iconBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
          accent: "hover:border-cyan-500/40",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      data-testid={`stat-card-${(title || "").toLowerCase().replace(/\s+/g, "-")}`}
      className={`bg-[#111827] border border-[#1e293b] rounded-xl p-5 shadow-lg transition-all duration-200 ${styles.accent}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg border ${styles.iconBg}`}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="h-8 w-24 bg-[#1e293b] animate-pulse rounded my-1" />
        ) : (
          <div className="text-2xl font-bold tracking-tight text-[#f8fafc] font-mono">
            {value !== undefined && value !== null ? value : "--"}
          </div>
        )}

        {(subtitle || trendLabel) && (
          <div className="mt-2 flex items-center gap-2 text-xs text-[#94a3b8]">
            {trend && (
              <span
                className={`font-mono font-medium ${
                  trend === "up"
                    ? "text-emerald-400"
                    : trend === "down"
                      ? "text-rose-400"
                      : "text-slate-400"
                }`}
              >
                {trend === "up" ? "▲" : trend === "down" ? "▼" : "—"}
              </span>
            )}
            <span>{trendLabel || subtitle}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatMetricCard;
