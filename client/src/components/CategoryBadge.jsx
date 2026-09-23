import React from "react";

const CATEGORY_STYLES = {
  Urgent: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  Work: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    dot: "bg-sky-500",
  },
  Personal: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  Promotional: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
  Uncategorized: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
};

const DEFAULT_STYLE = {
  bg: "bg-slate-50",
  text: "text-slate-700",
  border: "border-slate-200",
  dot: "bg-slate-500",
};

export function CategoryBadge({
  category = "Uncategorized",
  confidenceScore = null,
  isOverridden = false,
  size = "md",
}) {
  const normCategory =
    category && CATEGORY_STYLES[category] ? category : "Uncategorized";
  const styles = CATEGORY_STYLES[normCategory] || DEFAULT_STYLE;

  const scoreFormatted =
    confidenceScore !== null && confidenceScore !== undefined
      ? `${Math.round(confidenceScore * 100)}%`
      : null;

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-xs"
      : size === "lg"
        ? "px-3 py-1.5 text-sm font-semibold"
        : "px-2.5 py-1 text-xs font-semibold";

  return (
    <span
      className={`inline-flex items-center rounded-full border ${styles.bg} ${styles.text} ${styles.border} ${sizeClasses}`}
      data-testid="category-badge"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot} mr-1.5`} />
      <span>{normCategory}</span>
      {scoreFormatted && !isOverridden && (
        <span className="ml-1.5 opacity-85">({scoreFormatted})</span>
      )}
      {isOverridden && (
        <span className="ml-1.5 px-1.5 py-0.2 bg-white/70 rounded text-[10px] uppercase font-bold tracking-tight">
          Overridden
        </span>
      )}
    </span>
  );
}

export default CategoryBadge;
