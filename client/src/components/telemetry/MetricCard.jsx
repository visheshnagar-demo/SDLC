import React from "react";
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
} from "lucide-react";

export default function MetricCard({
  title,
  value,
  unit,
  status = "SAFE",
  safeRange = "",
  icon: Icon = Activity,
}) {
  const getStatusConfig = () => {
    switch (status?.toUpperCase()) {
      case "CRITICAL":
        return {
          bg: "bg-[#4c0519]/40",
          border: "border-[#fb7185]/50",
          text: "text-[#fb7185]",
          badgeBg: "bg-[#4c0519]",
          badgeText: "text-[#fb7185]",
          icon: AlertOctagon,
          label: "Critical",
        };
      case "WARNING":
        return {
          bg: "bg-[#451a03]/40",
          border: "border-[#fbbf24]/50",
          text: "text-[#fbbf24]",
          badgeBg: "bg-[#451a03]",
          badgeText: "text-[#fbbf24]",
          icon: AlertTriangle,
          label: "Warning",
        };
      case "SAFE":
      default:
        return {
          bg: "bg-[#141c27]",
          border: "border-[#1e2e45]",
          text: "text-[#34d399]",
          badgeBg: "bg-[#064e3b]",
          badgeText: "text-[#34d399]",
          icon: ShieldCheck,
          label: "Safe",
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <div
      className={`p-5 rounded-xl border transition-all hover:border-[#00e5ff]/40 bg-[#141c27] ${config.border}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs text-[#bac9cc] font-mono uppercase tracking-wider flex items-center gap-1.5">
          <Icon className="w-4 h-4 text-[#00e5ff]" />
          <span>{title}</span>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium ${config.badgeBg} ${config.badgeText}`}
        >
          <StatusIcon className="w-3 h-3" />
          {config.label}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold font-mono text-[#c3f5ff] tracking-tight">
          {value !== null && value !== undefined ? value : "--"}
        </span>
        {unit && (
          <span className="text-sm font-mono text-[#bac9cc]">{unit}</span>
        )}
      </div>

      {safeRange && (
        <div className="mt-3 pt-3 border-t border-[#1e2e45]/80 flex items-center justify-between text-xs font-mono">
          <span className="text-[#8899a6]">Target Range:</span>
          <span className="text-[#bac9cc] font-medium">{safeRange}</span>
        </div>
      )}
    </div>
  );
}
