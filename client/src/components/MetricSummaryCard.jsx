import React from "react";
import { Activity, ShieldCheck, Zap, AlertOctagon } from "lucide-react";

export default function MetricSummaryCard({
  title,
  value,
  subtitle,
  iconType = "activity",
  variant = "cyan", // 'cyan', 'emerald', 'amber', 'rose'
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case "emerald":
        return {
          border: "border-emerald-500/30",
          bg: "bg-emerald-500/5",
          iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
          glow: "group-hover:border-emerald-500/50",
        };
      case "amber":
        return {
          border: "border-amber-500/30",
          bg: "bg-amber-500/5",
          iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          badge: "text-amber-400 bg-amber-500/10 border-amber-500/20",
          glow: "group-hover:border-amber-500/50",
        };
      case "rose":
        return {
          border: "border-rose-500/30",
          bg: "bg-rose-500/5",
          iconBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          badge: "text-rose-400 bg-rose-500/10 border-rose-500/20",
          glow: "group-hover:border-rose-500/50",
        };
      case "cyan":
      default:
        return {
          border: "border-cyan-500/30",
          bg: "bg-cyan-500/5",
          iconBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
          badge: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
          glow: "group-hover:border-cyan-500/50",
        };
    }
  };

  const renderIcon = () => {
    switch (iconType) {
      case "shield":
        return <ShieldCheck className="w-5 h-5" />;
      case "zap":
        return <Zap className="w-5 h-5" />;
      case "alert":
        return <AlertOctagon className="w-5 h-5" />;
      case "activity":
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className={`group relative overflow-hidden rounded-xl bg-[#0f131c] border ${styles.border} ${styles.bg} p-5 shadow-lg transition-all duration-200 ${styles.glow}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono tracking-wide text-slate-400 uppercase mb-1.5">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold font-mono text-slate-100 tracking-tight">
            {value !== undefined && value !== null ? value : "--"}
          </h3>
        </div>
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center border shadow-sm ${styles.iconBg}`}
        >
          {renderIcon()}
        </div>
      </div>

      {subtitle && (
        <div className="mt-3 flex items-center text-xs text-slate-400">
          <span
            className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-mono border mr-2 ${styles.badge}`}
          >
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
}
