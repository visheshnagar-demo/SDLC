import React from "react";

export default function StatusBadge({ status, type = "status" }) {
  if (type === "compliance") {
    const isCompliant = Boolean(status);
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isCompliant
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
            : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 mr-1.5 rounded-full ${
            isCompliant ? "bg-emerald-500" : "bg-rose-500"
          }`}
        />
        {isCompliant ? "Compliant" : "Non-Compliant"}
      </span>
    );
  }

  const getStyle = (s) => {
    switch (s?.toLowerCase()) {
      case "available":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 bg-blue-500";
      case "assigned":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 bg-emerald-500";
      case "pending return":
      case "pending_return":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 bg-amber-500";
      case "wiped":
      case "locked":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 bg-purple-500";
      case "decommissioned":
      case "inactive":
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 bg-slate-500";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 bg-gray-500";
    }
  };

  const styleClass = getStyle(status);
  const parts = styleClass.split(" ");
  const dotColor = parts.pop();
  const badgeClasses = parts.join(" ");

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${badgeClasses}`}
    >
      <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${dotColor}`} />
      {status || "Unknown"}
    </span>
  );
}
