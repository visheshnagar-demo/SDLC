import React from "react";

export const Badge = ({
  variant = "default",
  type,
  size = "md",
  children,
  className = "",
}) => {
  const getVariantStyles = () => {
    const val = String(children || "").toLowerCase();

    // Specific Status Styles
    if (val === "in progress" || val === "in_progress") {
      return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    }
    if (
      val === "ready" ||
      val === "ready for deployment" ||
      val === "completed" ||
      val === "resolved" ||
      val === "success"
    ) {
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    }
    if (val === "deployed") {
      return "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
    }
    if (val === "draft" || val === "open") {
      return "bg-slate-500/20 text-slate-300 border-slate-500/40";
    }
    if (
      val === "failed" ||
      val === "blocker" ||
      val === "critical" ||
      val === "rolled back" ||
      val === "rolled_back"
    ) {
      return "bg-rose-500/20 text-rose-300 border-rose-500/40";
    }
    if (val === "archived" || val === "cancelled" || val === "closed") {
      return "bg-slate-700/40 text-slate-400 border-slate-600/40";
    }
    if (val === "feature") {
      return "bg-purple-500/20 text-purple-300 border-purple-500/40";
    }
    if (val === "bug") {
      return "bg-rose-500/20 text-rose-300 border-rose-500/40";
    }
    if (val === "high") {
      return "bg-orange-500/20 text-orange-300 border-orange-500/40";
    }
    if (val === "medium") {
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
    }
    if (val === "low") {
      return "bg-blue-500/20 text-blue-300 border-blue-500/40";
    }

    // Default variants
    switch (variant) {
      case "primary":
        return "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
      case "success":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "warning":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "error":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "secondary":
        return "bg-sky-500/20 text-sky-300 border-sky-500/40";
      case "neutral":
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const sizeStyles =
    {
      sm: "px-1.5 py-0.5 text-[10px]",
      md: "px-2.5 py-1 text-xs",
      lg: "px-3 py-1.5 text-sm",
    }[size] || "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border tracking-wide uppercase ${getVariantStyles()} ${sizeStyles} ${className}`}
    >
      {type === "dot" && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 animate-pulse" />
      )}
      {children}
    </span>
  );
};

export default Badge;
