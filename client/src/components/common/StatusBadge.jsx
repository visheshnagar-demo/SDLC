import React from "react";

export function StatusBadge({ status }) {
  const normStatus = (status || "").toUpperCase();

  let colorClasses = "bg-slate-100 text-slate-800 border-slate-200";

  switch (normStatus) {
    case "CONFIRMED":
      colorClasses = "bg-blue-50 text-blue-700 border-blue-200";
      break;
    case "IN_PROGRESS":
      colorClasses =
        "bg-amber-50 text-amber-700 border-amber-200 animate-pulse";
      break;
    case "COMPLETED":
      colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
      break;
    case "CANCELLED":
      colorClasses = "bg-rose-50 text-rose-700 border-rose-200";
      break;
    case "PENDING":
      colorClasses = "bg-purple-50 text-purple-700 border-purple-200";
      break;
    case "ACTIVE":
    case "AVAILABLE":
      colorClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
      break;
    case "INACTIVE":
    case "OFF_DUTY":
      colorClasses = "bg-slate-100 text-slate-600 border-slate-200";
      break;
    default:
      colorClasses = "bg-slate-100 text-slate-700 border-slate-200";
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses}`}
    >
      <span
        className={`w-1.5 h-1.5 mr-1.5 rounded-full ${
          normStatus === "CONFIRMED"
            ? "bg-blue-500"
            : normStatus === "IN_PROGRESS"
              ? "bg-amber-500"
              : normStatus === "COMPLETED"
                ? "bg-emerald-500"
                : normStatus === "CANCELLED"
                  ? "bg-rose-500"
                  : "bg-slate-400"
        }`}
      />
      {normStatus.replace("_", " ") || "UNKNOWN"}
    </span>
  );
}

export default StatusBadge;
