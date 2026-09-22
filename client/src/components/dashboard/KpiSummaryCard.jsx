import React from "react";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

export default function KpiSummaryCard({
  title,
  value,
  subtext,
  trend,
  trendDirection = "up",
  icon: Icon,
  badge,
  color = "#06b6d4",
}) {
  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 flex flex-col justify-between hover:border-[#334155] transition-all shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-xs font-medium text-[#bcc9cd]">{title}</span>
          <div className="text-2xl font-bold font-mono text-[#dae2fd] mt-1">
            {value}
          </div>
        </div>
        <div
          className="p-2 rounded-lg border"
          style={{
            backgroundColor: `${color}15`,
            borderColor: `${color}40`,
            color: color,
          }}
        >
          {Icon ? (
            <Icon className="w-5 h-5" />
          ) : (
            <Activity className="w-5 h-5" />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs pt-2 border-t border-[#1e293b]/60">
        <span className="text-[#bcc9cd] truncate">{subtext}</span>
        {trend && (
          <span
            className={`flex items-center gap-0.5 font-mono font-medium ${
              trendDirection === "up" ? "text-[#10b981]" : "text-[#f43f5e]"
            }`}
          >
            {trendDirection === "up" ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend}
          </span>
        )}
        {badge && (
          <span className="bg-[#171f33] text-[#06b6d4] text-[10px] px-2 py-0.5 rounded font-mono border border-[#06b6d4]/30">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
