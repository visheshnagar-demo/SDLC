import React from "react";

export const StatusBadge = ({
  status = "PENDING",
  size = "md",
  pulse = true,
}) => {
  const normalizedStatus = (status || "").toUpperCase();

  const getStatusConfig = () => {
    switch (normalizedStatus) {
      case "HEALTHY":
      case "UP":
      case "200":
        return {
          bg: "bg-emerald-500/10",
          text: "text-emerald-400",
          border: "border-emerald-500/30",
          dot: "bg-emerald-400",
          label: "HEALTHY",
        };
      case "DEGRADED":
      case "SLOW":
        return {
          bg: "bg-amber-500/10",
          text: "text-amber-400",
          border: "border-amber-500/30",
          dot: "bg-amber-400",
          label: "DEGRADED",
        };
      case "UNHEALTHY":
      case "DOWN":
      case "FAILED":
      case "ERROR":
        return {
          bg: "bg-rose-500/10",
          text: "text-rose-400",
          border: "border-rose-500/30",
          dot: "bg-rose-400",
          label: "UNHEALTHY",
        };
      case "ACTIVE":
        return {
          bg: "bg-cyan-500/10",
          text: "text-cyan-400",
          border: "border-cyan-500/30",
          dot: "bg-cyan-400",
          label: "ACTIVE",
        };
      case "INACTIVE":
      case "PAUSED":
        return {
          bg: "bg-slate-700/30",
          text: "text-slate-400",
          border: "border-slate-600/30",
          dot: "bg-slate-400",
          label: "INACTIVE",
        };
      case "PENDING":
      default:
        return {
          bg: "bg-sky-500/10",
          text: "text-sky-400",
          border: "border-sky-500/30",
          dot: "bg-sky-400",
          label: normalizedStatus || "PENDING",
        };
    }
  };

  const config = getStatusConfig();
  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-semibold";

  return (
    <span
      data-testid="status-badge"
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses} font-mono uppercase tracking-wide`}
    >
      <span className="relative flex h-2 w-2">
        {pulse &&
          (normalizedStatus === "HEALTHY" ||
            normalizedStatus === "UNHEALTHY" ||
            normalizedStatus === "DEGRADED") && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`}
            />
          )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`}
        />
      </span>
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
