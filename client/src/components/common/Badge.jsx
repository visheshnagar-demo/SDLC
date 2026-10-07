import React from "react";
import clsx from "clsx";

export const Badge = ({ variant = "default", children, className = "" }) => {
  const normalized = (
    typeof children === "string" ? children.toLowerCase() : variant
  ).trim();

  let colorClasses = "bg-slate-100 text-slate-700 border-slate-200";

  if (
    normalized.includes("healthy") ||
    normalized.includes("active") ||
    normalized.includes("manager")
  ) {
    colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (
    normalized.includes("treatment") ||
    normalized.includes("pending") ||
    normalized.includes("worker")
  ) {
    colorClasses = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (
    normalized.includes("quarantine") ||
    normalized.includes("alert") ||
    normalized.includes("urgent") ||
    normalized.includes("drop")
  ) {
    colorClasses = "bg-rose-50 text-rose-700 border-rose-200";
  } else if (
    normalized.includes("vaccination") ||
    normalized.includes("checkup") ||
    normalized.includes("info")
  ) {
    colorClasses = "bg-sky-50 text-sky-700 border-sky-200";
  } else if (normalized.includes("sold") || normalized.includes("deceased")) {
    colorClasses = "bg-slate-100 text-slate-500 border-slate-300";
  }

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        colorClasses,
        className,
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
