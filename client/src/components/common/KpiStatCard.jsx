import React from "react";
import clsx from "clsx";

export const KpiStatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  badgeText,
  badgeType = "positive",
  className = "",
}) => {
  return (
    <div
      className={clsx(
        "bg-white rounded-xl border border-slate-200 p-5 shadow-sm transition hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        {Icon && (
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </div>
        {badgeText && (
          <span
            className={clsx(
              "inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full",
              badgeType === "positive" && "bg-emerald-50 text-emerald-700",
              badgeType === "negative" && "bg-rose-50 text-rose-700",
              badgeType === "warning" && "bg-amber-50 text-amber-700",
              badgeType === "neutral" && "bg-slate-100 text-slate-700",
            )}
          >
            {badgeText}
          </span>
        )}
      </div>

      {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
    </div>
  );
};

export default KpiStatCard;
